import { randomBytes, randomUUID, createHash } from "node:crypto";
import { and, eq, isNull, desc, lte, sql } from "drizzle-orm";
import { db, organizations, organizationMemberships as memberships, organizationInvitations as invitations, organizationAuditEvents as audits, workspaceContexts as contexts, profiles } from "@workspace/db";
import type { OrganizationRole, OrganizationRecord } from "@workspace/db";
import { initializeProfile } from "./profile-service";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
type InviteRole = "admin" | "member" | "viewer";
type OrganizationInput = Pick<OrganizationRecord, "name" | "description" | "type" | "country" | "website">;
export class OrganizationError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
function reject(status: number, message: string): never { throw new OrganizationError(status, message); }
export const hashInvitationToken = (token: string) => createHash("sha256").update(token).digest("hex");
const activeOrg = (id: string) => and(eq(organizations.id, id), isNull(organizations.deletedAt));
const memberWhere = (id: string, user: string) => and(eq(memberships.organizationId, id), eq(memberships.userId, user));

async function audit(tx: Tx, organizationId: string, actorUserId: string, action: string, metadata: Record<string, string> = {}) {
  await tx.insert(audits).values({ id: randomUUID(), organizationId, actorUserId, action, metadata });
}

// All organization mutations serialize on the organization row. Authorization is
// read after the lock, preventing stale-role and last-owner races.
async function withOrganization<T>(id: string, user: string, allowed: OrganizationRole[], action: (tx: Tx, org: OrganizationRecord, role: OrganizationRole) => Promise<T>) {
  return db.transaction(async (tx) => {
    const [org] = await tx.select().from(organizations).where(activeOrg(id)).for("update");
    if (!org) reject(404, "Organization not found.");
    const [membership] = await tx.select().from(memberships).where(memberWhere(id, user));
    if (!membership) reject(404, "Organization not found.");
    if (!allowed.includes(membership.role)) reject(403, "Your role does not permit this action.");
    return action(tx, org, membership.role);
  });
}
const allRoles: OrganizationRole[] = ["owner", "admin", "member", "viewer"];
const managers: OrganizationRole[] = ["owner", "admin"];

function manageable(actor: OrganizationRole, target: OrganizationRole, next?: InviteRole) {
  if (target === "owner") reject(409, "Transfer ownership explicitly before changing the owner.");
  if (actor === "admin" && (target === "admin" || next === "admin")) reject(403, "Admins can manage only members and viewers.");
}
function publicInvitation(invite: typeof invitations.$inferSelect) {
  return { id: invite.id, email: invite.email, role: invite.role,
    status: invite.status === "pending" && invite.expiresAt <= new Date() ? "expired" as const : invite.status,
    createdAt: invite.createdAt.toISOString(), expiresAt: invite.expiresAt.toISOString() };
}

export async function listOrganizations(user: string) {
  const rows = await db.select({
    id: organizations.id, slug: organizations.slug, name: organizations.name, description: organizations.description,
    type: organizations.type, country: organizations.country, website: organizations.website,
    ownerUserId: organizations.ownerUserId, createdAt: organizations.createdAt, updatedAt: organizations.updatedAt,
    role: memberships.role,
    memberCount: sql<number>`(select count(*) from organization_memberships m where m.organization_id = ${organizations.id})`,
    pendingInvitationCount: sql<number>`(select count(*) from organization_invitations i where i.organization_id = ${organizations.id} and i.status = 'pending' and i.expires_at > now())`,
  }).from(organizations).innerJoin(memberships, eq(organizations.id, memberships.organizationId))
    .where(and(eq(memberships.userId, user), isNull(organizations.deletedAt))).orderBy(desc(organizations.createdAt));
  return rows.map((row) => ({ ...row, createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString(),
    memberCount: Number(row.memberCount), pendingInvitationCount: Number(row.pendingInvitationCount) }));
}
export async function getOrganization(id: string, user: string) {
  const org = (await listOrganizations(user)).find((o) => o.id === id);
  if (!org) reject(404, "Organization not found.");
  return org;
}
export async function createOrganization(user: string, input: OrganizationInput) {
  await initializeProfile(user);
  const id = randomUUID();
  const baseSlug = input.name.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "organization";
  await db.transaction(async (tx) => {
    await tx.insert(organizations).values({ ...input, id, slug: `${baseSlug}-${id}`, ownerUserId: user });
    await tx.insert(memberships).values({ id: randomUUID(), organizationId: id, userId: user, role: "owner" });
    await audit(tx, id, user, "organization.created");
  });
  return getOrganization(id, user);
}
export async function updateOrganization(id: string, user: string, input: OrganizationInput) {
  await withOrganization(id, user, managers, async (tx) => {
    await tx.update(organizations).set({ ...input, updatedAt: new Date() }).where(eq(organizations.id, id));
    await audit(tx, id, user, "organization.updated", { fields: "name,description,type,country,website" });
  });
  return getOrganization(id, user);
}
export async function listMembers(id: string, user: string) {
  await getOrganization(id, user);
  return db.select({ id: memberships.id, userId: memberships.userId, displayName: profiles.displayName,
    role: memberships.role, status: sql<"active">`'active'`, joinedAt: memberships.createdAt })
    .from(memberships).innerJoin(profiles, eq(profiles.id, memberships.userId))
    .where(eq(memberships.organizationId, id)).orderBy(memberships.createdAt)
    .then((rows) => rows.map((r) => ({ ...r, joinedAt: r.joinedAt.toISOString() })));
}
export async function changeRole(id: string, user: string, target: string, role: InviteRole) {
  await withOrganization(id, user, managers, async (tx, _org, actorRole) => {
    const [member] = await tx.select().from(memberships).where(memberWhere(id, target));
    if (!member) reject(404, "Member not found.");
    manageable(actorRole, member.role, role);
    await tx.update(memberships).set({ role }).where(memberWhere(id, target));
    await audit(tx, id, user, "member.role_changed", { userId: target, from: member.role, to: role });
  });
}
export async function removeMember(id: string, user: string, target: string) {
  if (user === target) reject(400, "Use Leave organization to end your own membership.");
  await withOrganization(id, user, managers, async (tx, _org, role) => {
    const [member] = await tx.select().from(memberships).where(memberWhere(id, target));
    if (!member) reject(404, "Member not found.");
    manageable(role, member.role);
    await tx.delete(memberships).where(memberWhere(id, target));
    await tx.update(contexts).set({ organizationId: null, updatedAt: new Date() })
      .where(and(eq(contexts.userId, target), eq(contexts.organizationId, id)));
    await audit(tx, id, user, "member.removed", { userId: target });
  });
}
export async function leaveOrganization(id: string, user: string) {
  await withOrganization(id, user, allRoles, async (tx, _org, role) => {
    if (role === "owner") reject(409, "The owner cannot leave. Transfer ownership first.");
    await tx.delete(memberships).where(memberWhere(id, user));
    await tx.update(contexts).set({ organizationId: null, updatedAt: new Date() })
      .where(and(eq(contexts.userId, user), eq(contexts.organizationId, id)));
    await audit(tx, id, user, "member.left");
  });
}
export async function transferOwnership(id: string, user: string, target: string, confirmation: string) {
  await withOrganization(id, user, ["owner"], async (tx, org) => {
    if (confirmation !== org.name) reject(400, "Type the exact organization name to confirm.");
    if (target === user) reject(400, "Choose another current member.");
    const [member] = await tx.select().from(memberships).where(memberWhere(id, target));
    if (!member) reject(404, "Choose a current organization member.");
    await tx.update(memberships).set({ role: "admin" }).where(memberWhere(id, user));
    await tx.update(memberships).set({ role: "owner" }).where(memberWhere(id, target));
    await tx.update(organizations).set({ ownerUserId: target, updatedAt: new Date() }).where(eq(organizations.id, id));
    await audit(tx, id, user, "ownership.transferred", { from: user, to: target });
  });
}
export async function archiveOrganization(id: string, user: string, confirmation: string) {
  await withOrganization(id, user, ["owner"], async (tx, org) => {
    if (confirmation !== org.name) reject(400, "Type the exact organization name to confirm.");
    await tx.update(organizations).set({ deletedAt: new Date(), updatedAt: new Date() }).where(eq(organizations.id, id));
    await tx.update(contexts).set({ organizationId: null, updatedAt: new Date() }).where(eq(contexts.organizationId, id));
    await audit(tx, id, user, "organization.archived");
  });
}
export async function listInvitations(id: string, user: string) {
  const org = await getOrganization(id, user);
  if (!managers.includes(org.role)) reject(403, "Only owners and admins can view invitations.");
  return (await db.select().from(invitations).where(eq(invitations.organizationId, id)).orderBy(desc(invitations.createdAt))).map(publicInvitation);
}
export async function inviteMember(id: string, user: string, email: string, role: InviteRole, recipientUserIds: string[] = []) {
  const token = randomBytes(32).toString("base64url");
  const invitation = await withOrganization(id, user, managers, async (tx, _org, actorRole) => {
    if (actorRole === "admin" && role === "admin") reject(403, "Admins cannot invite administrative roles.");
    for (const recipient of recipientUserIds) {
      if ((await tx.select().from(memberships).where(memberWhere(id, recipient))).length) reject(409, "That account is already a member.");
    }
    // Expired pending records are retired before the unique pending-email check.
    await tx.update(invitations).set({ status: "expired", updatedAt: new Date() })
      .where(and(eq(invitations.organizationId, id), eq(invitations.email, email), eq(invitations.status, "pending"), lte(invitations.expiresAt, new Date())));
    const duplicate = await tx.select().from(invitations).where(and(eq(invitations.organizationId, id), eq(invitations.email, email), eq(invitations.status, "pending")));
    if (duplicate.length) reject(409, "A pending invitation already exists for this email.");
    const [row] = await tx.insert(invitations).values({ id: randomUUID(), organizationId: id, email, role,
      invitedBy: user, tokenHash: hashInvitationToken(token), expiresAt: new Date(Date.now() + 7 * 24 * 3600_000) }).returning();
    await audit(tx, id, user, "member.invited", { invitationId: row!.id, role });
    return publicInvitation(row!);
  });
  return { invitation, token, delivery: "manual" as const };
}
export async function revokeInvitation(id: string, user: string, invitationId: string) {
  await withOrganization(id, user, managers, async (tx, _org, actorRole) => {
    const [row] = await tx.select().from(invitations).where(and(eq(invitations.id, invitationId), eq(invitations.organizationId, id)));
    if (!row) reject(404, "Invitation not found.");
    if (actorRole === "admin" && row.role === "admin") reject(403, "Admins cannot manage administrative invitations.");
    if (row.status !== "pending" || row.expiresAt <= new Date()) reject(409, "This invitation is no longer pending.");
    await tx.update(invitations).set({ status: "revoked", updatedAt: new Date() }).where(eq(invitations.id, invitationId));
    await audit(tx, id, user, "invitation.revoked", { invitationId });
  });
}
// verifiedEmails MUST originate from Clerk's server-side verified email records.
// Never accept an email or role claimed by the invitation-accept request.
export async function acceptInvitation(user: string, token: string, verifiedEmails: string[]) {
  const [found] = await db.select({ organizationId: invitations.organizationId }).from(invitations).where(eq(invitations.tokenHash, hashInvitationToken(token)));
  if (!found) reject(404, "Invitation not found.");
  await initializeProfile(user);
  return db.transaction(async (tx) => {
    const [org] = await tx.select().from(organizations).where(activeOrg(found.organizationId)).for("update");
    if (!org) reject(404, "Invitation not found.");
    const [row] = await tx.select().from(invitations).where(eq(invitations.tokenHash, hashInvitationToken(token))).for("update");
    if (!row || row.status !== "pending" || row.expiresAt <= new Date()) reject(410, "This invitation has expired or is no longer available.");
    if (!verifiedEmails.map((e) => e.toLowerCase()).includes(row.email)) reject(403, "Sign in with the verified email address this invitation was sent to.");
    if ((await tx.select().from(memberships).where(memberWhere(org.id, user))).length) reject(409, "You are already a member of this organization.");
    await tx.insert(memberships).values({ id: randomUUID(), organizationId: org.id, userId: user, role: row.role });
    await tx.update(invitations).set({ status: "accepted", acceptedBy: user, updatedAt: new Date() }).where(eq(invitations.id, row.id));
    await audit(tx, org.id, user, "invitation.accepted", { invitationId: row.id, role: row.role });
    return { ok: true, organizationId: org.id };
  });
}
export async function getWorkspace(user: string) {
  const list = await listOrganizations(user);
  const [context] = await db.select().from(contexts).where(eq(contexts.userId, user));
  return { organizations: list, selectedOrganizationId: list.some((org) => org.id === context?.organizationId) ? context!.organizationId : null };
}
export async function selectWorkspace(user: string, id: string | null) {
  await initializeProfile(user);
  const save = async (tx: Tx) => {
    await tx.insert(contexts).values({ userId: user, organizationId: id }).onConflictDoUpdate({
      target: contexts.userId, set: { organizationId: id, updatedAt: new Date() },
    });
  };
  if (id) await withOrganization(id, user, allRoles, async (tx) => save(tx));
  else await db.transaction(save);
  return getWorkspace(user);
}
export async function listAudit(id: string, user: string) {
  const org = await getOrganization(id, user);
  if (!managers.includes(org.role)) reject(403, "Only owners and admins can view administrative history.");
  return (await db.select({ id: audits.id, action: audits.action, actorName: profiles.displayName, metadata: audits.metadata, createdAt: audits.createdAt })
    .from(audits).leftJoin(profiles, eq(profiles.id, audits.actorUserId))
    .where(eq(audits.organizationId, id)).orderBy(desc(audits.createdAt)).limit(100))
    .map((r) => ({ ...r, actorName: r.actorName || "Account member", createdAt: r.createdAt.toISOString() }));
}
