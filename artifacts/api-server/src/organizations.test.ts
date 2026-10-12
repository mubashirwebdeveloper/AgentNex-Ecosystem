import { test, after } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { eq, inArray, and } from "drizzle-orm";
import { db, pool, profiles, organizations, organizationMemberships as memberships, organizationInvitations as invitations, organizationAuditEvents as audits } from "@workspace/db";
import { CreateOrganizationBody, InviteOrganizationMemberBody, ChangeOrganizationRoleBody, AcceptOrganizationInvitationBody, SelectWorkspaceBody } from "@workspace/api-zod";
import * as service from "./lib/organization-service";
import { initializeProfile, dashboardFor } from "./lib/profile-service";

const ids = Array.from({ length: 6 }, () => `orgtest_${randomUUID()}`);
const [owner, admin, member, viewer, outsider, extra] = ids as [string, string, string, string, string, string];
const orgIds: string[] = [];
const input = { name: "Organization integration fixture", description: "Isolated test fixture", country: "Canada", website: "https://example.com", type: "business" as const };
const denied = (status: number) => (error: unknown) => error instanceof service.OrganizationError && error.status === status;
after(async () => {
  if (orgIds.length) await db.delete(organizations).where(inArray(organizations.id, orgIds));
  await db.delete(profiles).where(inArray(profiles.id, ids));
  await pool.end();
});

test("organization multi-tenant lifecycle and security (isolated, cleaned fixtures)", async (t) => {
  for (const id of ids) await initializeProfile(id);
  const org = await service.createOrganization(owner, input);
  orgIds.push(org.id);
  const second = await service.createOrganization(owner, input);
  orgIds.push(second.id);

  await t.test("create, reload, duplicate-name slugs, personal dashboard and context", async () => {
    assert.equal(org.role, "owner");
    assert.equal(org.ownerUserId, owner);
    assert.equal(org.memberCount, 1);
    assert.notEqual(org.slug, second.slug);
    assert.match(org.slug, /^[a-z0-9-]+$/);
    assert.equal((await service.getOrganization(org.id, owner)).description, input.description);
    assert.equal((await service.listOrganizations(owner)).length, 2);
    await service.selectWorkspace(owner, org.id);
    assert.equal((await service.getWorkspace(owner)).selectedOrganizationId, org.id);
    await service.selectWorkspace(owner, second.id);
    assert.equal((await service.getWorkspace(owner)).selectedOrganizationId, second.id);
    await service.selectWorkspace(owner, null);
    assert.equal((await service.getWorkspace(owner)).selectedOrganizationId, null);
    assert.deepEqual((await service.getWorkspace(outsider)).organizations, []);
    assert.equal(dashboardFor(await initializeProfile(outsider)).profileCompletion, 0);
    await assert.rejects(service.leaveOrganization(org.id, owner), denied(409));
    await assert.rejects(service.removeMember(org.id, owner, owner), denied(400));
  });

  await t.test("cross-tenant access denied, including direct mutation and selected context", async () => {
    await assert.rejects(service.getOrganization(org.id, outsider), denied(404));
    await assert.rejects(service.listMembers(org.id, outsider), denied(404));
    await assert.rejects(service.listInvitations(org.id, outsider), denied(404));
    await assert.rejects(service.listAudit(org.id, outsider), denied(404));
    await assert.rejects(service.updateOrganization(org.id, outsider, input), denied(404));
    await assert.rejects(service.selectWorkspace(outsider, org.id), denied(404));
    await assert.rejects(service.transferOwnership(org.id, outsider, outsider, input.name), denied(404));
  });

  await t.test("secure recipient binding, hash-only storage, single-use admission", async () => {
    const invited = await service.inviteMember(org.id, owner, "admin@example.com", "admin");
    assert.match(invited.token, /^[A-Za-z0-9_-]{43}$/);
    const [stored] = await db.select().from(invitations).where(eq(invitations.id, invited.invitation.id));
    assert.equal(stored!.tokenHash, service.hashInvitationToken(invited.token));
    assert.notEqual(stored!.tokenHash, invited.token);
    assert.equal("tokenHash" in invited.invitation, false);
    await assert.rejects(service.inviteMember(org.id, owner, "admin@example.com", "member"), denied(409));
    await assert.rejects(service.acceptInvitation(outsider, invited.token, ["wrong@example.com"]), denied(403));
    await assert.rejects(service.acceptInvitation(admin, invited.token, []), denied(403));
    await service.acceptInvitation(admin, invited.token, ["admin@example.com"]);
    await assert.rejects(service.acceptInvitation(admin, invited.token, ["admin@example.com"]), denied(410));
    for (const [id, email, role] of [[member, "member@example.com", "member"], [viewer, "viewer@example.com", "viewer"]] as const) {
      const invite = await service.inviteMember(org.id, owner, email, role);
      await service.acceptInvitation(id, invite.token, [email]);
    }
    assert.equal((await service.listMembers(org.id, owner)).length, 4);
    assert.equal((await service.getOrganization(org.id, owner)).memberCount, 4);
    await assert.rejects(service.inviteMember(org.id, owner, "admin@example.com", "admin", [admin]), denied(409));
    await assert.rejects(db.insert(memberships).values({ id: randomUUID(), organizationId: org.id, userId: member, role: "member" }));
  });

  await t.test("owner/admin boundaries, member/viewer restrictions and role escalation", async () => {
    await service.updateOrganization(org.id, admin, { ...input, description: "Saved by admin" });
    assert.equal((await service.getOrganization(org.id, owner)).description, "Saved by admin");
    for (const id of [member, viewer]) {
      await assert.rejects(service.updateOrganization(org.id, id, input), denied(403));
      await assert.rejects(service.inviteMember(org.id, id, "new@example.com", "member"), denied(403));
      await assert.rejects(service.changeRole(org.id, id, id, "admin"), denied(403));
      await assert.rejects(service.listInvitations(org.id, id), denied(403));
      await assert.rejects(service.listAudit(org.id, id), denied(403));
      await assert.rejects(service.removeMember(org.id, id, admin), denied(403));
      assert.ok((await service.listMembers(org.id, id)).length > 0);
    }
    await assert.rejects(service.inviteMember(org.id, admin, "newadmin@example.com", "admin"), denied(403));
    await assert.rejects(service.changeRole(org.id, admin, member, "admin"), denied(403));
    await assert.rejects(service.changeRole(org.id, admin, admin, "member"), denied(403));
    await assert.rejects(service.removeMember(org.id, admin, owner), denied(409));
    await assert.rejects(service.transferOwnership(org.id, admin, member, input.name), denied(403));
    await assert.rejects(service.archiveOrganization(org.id, admin, input.name), denied(403));
    await service.changeRole(org.id, admin, member, "viewer");
    assert.equal((await service.listMembers(org.id, owner)).find((m) => m.userId === member)!.role, "viewer");
    await service.changeRole(org.id, owner, member, "member");
    await assert.rejects(service.changeRole(org.id, owner, owner, "admin"), denied(409));
  });

  await t.test("revoked, expired, duplicate-member and concurrent replay invitations", async () => {
    const revoked = await service.inviteMember(org.id, admin, "revoked@example.com", "viewer");
    await service.revokeInvitation(org.id, admin, revoked.invitation.id);
    await assert.rejects(service.acceptInvitation(extra, revoked.token, ["revoked@example.com"]), denied(410));
    const expired = await service.inviteMember(org.id, owner, "expired@example.com", "member");
    await db.update(invitations).set({ expiresAt: new Date(Date.now() - 1000) }).where(eq(invitations.id, expired.invitation.id));
    await assert.rejects(service.acceptInvitation(extra, expired.token, ["expired@example.com"]), denied(410));
    const replacement = await service.inviteMember(org.id, owner, "expired@example.com", "member");
    assert.notEqual(expired.invitation.id, replacement.invitation.id);
    const duplicate = await service.inviteMember(org.id, owner, "already@example.com", "viewer");
    await assert.rejects(service.acceptInvitation(member, duplicate.token, ["already@example.com"]), denied(409));
    const concurrent = await service.inviteMember(org.id, admin, "concurrent@example.com", "member");
    const outcomes = await Promise.allSettled([
      service.acceptInvitation(extra, concurrent.token, ["concurrent@example.com"]),
      service.acceptInvitation(extra, concurrent.token, ["concurrent@example.com"]),
    ]);
    assert.equal(outcomes.filter((o) => o.status === "fulfilled").length, 1);
    assert.equal(outcomes.filter((o) => o.status === "rejected").length, 1);
    const ownersAdmin = await service.inviteMember(org.id, owner, "adminonly@example.com", "admin");
    await assert.rejects(service.revokeInvitation(org.id, admin, ownersAdmin.invitation.id), denied(403));
    await service.revokeInvitation(org.id, owner, ownersAdmin.invitation.id);
  });

  await t.test("explicit atomic ownership transfer and last-owner protection", async () => {
    await assert.rejects(service.transferOwnership(org.id, owner, member, "wrong confirmation"), denied(400));
    await assert.rejects(service.transferOwnership(org.id, owner, outsider, input.name), denied(404));
    await service.transferOwnership(org.id, owner, member, input.name);
    assert.equal((await service.getOrganization(org.id, owner)).role, "admin");
    assert.equal((await service.getOrganization(org.id, member)).ownerUserId, member);
    assert.equal((await service.listMembers(org.id, member)).filter((m) => m.role === "owner").length, 1);
    await assert.rejects(service.leaveOrganization(org.id, member), denied(409));
    await assert.rejects(service.transferOwnership(org.id, owner, admin, input.name), denied(403));
    await service.transferOwnership(org.id, member, owner, input.name);
  });

  await t.test("leave/remove clears context and immediately denies subsequent reads", async () => {
    await service.selectWorkspace(viewer, org.id);
    await service.leaveOrganization(org.id, viewer);
    assert.equal((await service.getWorkspace(viewer)).selectedOrganizationId, null);
    await assert.rejects(service.getOrganization(org.id, viewer), denied(404));
    await service.selectWorkspace(extra, org.id);
    await service.removeMember(org.id, admin, extra);
    assert.equal((await service.getWorkspace(extra)).selectedOrganizationId, null);
    await assert.rejects(service.getOrganization(org.id, extra), denied(404));
  });

  await t.test("real audit events, no token/email metadata, confirmed soft deletion", async () => {
    const history = await service.listAudit(org.id, owner);
    for (const action of ["organization.created", "organization.updated", "member.invited", "invitation.accepted", "invitation.revoked", "member.role_changed", "ownership.transferred", "member.left", "member.removed"]) {
      assert.ok(history.some((event) => event.action === action), action);
    }
    assert.ok(history.every((event) => !JSON.stringify(event.metadata).includes("token") && !JSON.stringify(event.metadata).includes("@")));
    await service.selectWorkspace(owner, org.id);
    await assert.rejects(service.archiveOrganization(org.id, owner, "wrong confirmation"), denied(400));
    await service.archiveOrganization(org.id, owner, input.name);
    await assert.rejects(service.getOrganization(org.id, owner), denied(404));
    assert.equal((await service.getWorkspace(owner)).selectedOrganizationId, null);
    const [retained] = await db.select().from(organizations).where(eq(organizations.id, org.id));
    assert.ok(retained!.deletedAt);
    assert.ok((await db.select().from(audits).where(and(eq(audits.organizationId, org.id), eq(audits.action, "organization.archived")))).length);
    assert.equal((await service.listOrganizations(owner)).length, 1);
  });
});

test("organization request schemas reject mass assignment, owner invitations and malformed tokens", () => {
  assert.equal(CreateOrganizationBody.strict().safeParse({ ...input, ownerUserId: outsider }).success, false);
  assert.equal(InviteOrganizationMemberBody.safeParse({ email: "person@example.com", role: "owner" }).success, false);
  assert.equal(ChangeOrganizationRoleBody.safeParse({ role: "owner" }).success, false);
  assert.equal(AcceptOrganizationInvitationBody.strict().safeParse({ token: "x".repeat(43), email: "someone@example.com" }).success, false);
  assert.equal(AcceptOrganizationInvitationBody.safeParse({ token: "../bad" }).success, false);
  assert.equal(SelectWorkspaceBody.strict().safeParse({ organizationId: null, role: "owner" }).success, false);
});
