import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import { clerkClient, getAuth } from "@clerk/express";
import { rateLimit } from "express-rate-limit";
import { CreateOrganizationBody, UpdateOrganizationBody, ChangeOrganizationRoleBody, InviteOrganizationMemberBody, TransferOrganizationOwnershipBody, ArchiveOrganizationBody, AcceptOrganizationInvitationBody, SelectWorkspaceBody } from "@workspace/api-zod";
import * as service from "../lib/organization-service";

const router: IRouter = Router();
router.use(["/organizations", "/workspace", "/invitations"], (req, res, next) => {
  const userId = getAuth(req).userId;
  if (!userId) { res.status(401).json({ error: "Sign in to access your workspace." }); return; }
  res.locals.userId = userId;
  res.setHeader("Cache-Control", "no-store");
  next();
}, rateLimit({ windowMs: 60_000, limit: 120, standardHeaders: "draft-7", legacyHeaders: false,
  keyGenerator: (_req, res) => res.locals.userId as string,
  message: { error: "Too many requests. Please try again shortly." },
}));
const user = (res: Response) => res.locals.userId as string;
const id = (req: Request) => String(req.params.organizationId);
const action = (req: Request) => ({ ok: true, organizationId: id(req) });
function safe(handler: (req: Request, res: Response) => Promise<unknown>) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try { await handler(req, res); } catch (error) {
      if (error instanceof service.OrganizationError) res.status(error.status).json({ error: error.message });
      else if (error && typeof error === "object" && "name" in error && error.name === "ZodError") res.status(400).json({ error: "Check the submitted fields and try again." });
      else next(error);
    }
  };
}
function organizationInput(data: ReturnType<typeof CreateOrganizationBody.parse>) {
  const clean = { ...data, name: data.name.trim(), country: data.country.trim(), description: data.description?.trim() ?? "", website: data.website?.trim() ?? "" };
  if (clean.name.length < 2 || clean.country.length < 2) throw new service.OrganizationError(400, "Enter an organization name and country.");
  if (clean.website) {
    try {
      const url = new URL(clean.website);
      if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) throw new Error();
    } catch { throw new service.OrganizationError(400, "Enter a valid http or https website URL."); }
  }
  return clean;
}
router.get("/organizations", safe(async (_req, res) => res.json(await service.listOrganizations(user(res)))));
router.post("/organizations", safe(async (req, res) => res.status(201).json(await service.createOrganization(user(res), organizationInput(CreateOrganizationBody.strict().parse(req.body))))));
router.get("/organizations/:organizationId", safe(async (req, res) => res.json(await service.getOrganization(id(req), user(res)))));
router.patch("/organizations/:organizationId", safe(async (req, res) => res.json(await service.updateOrganization(id(req), user(res), organizationInput(UpdateOrganizationBody.strict().parse(req.body))))));
router.get("/organizations/:organizationId/members", safe(async (req, res) => res.json(await service.listMembers(id(req), user(res)))));
router.patch("/organizations/:organizationId/members/:userId", safe(async (req, res) => {
  const data = ChangeOrganizationRoleBody.strict().parse(req.body);
  await service.changeRole(id(req), user(res), String(req.params.userId), data.role);
  res.json(action(req));
}));
router.delete("/organizations/:organizationId/members/:userId", safe(async (req, res) => {
  await service.removeMember(id(req), user(res), String(req.params.userId)); res.json(action(req));
}));
router.get("/organizations/:organizationId/invitations", safe(async (req, res) => res.json(await service.listInvitations(id(req), user(res)))));
router.post("/organizations/:organizationId/invitations", safe(async (req, res) => {
  const data = InviteOrganizationMemberBody.strict().parse(req.body);
  const organization = await service.getOrganization(id(req), user(res));
  if (!["owner", "admin"].includes(organization.role) || (organization.role === "admin" && data.role === "admin")) {
    throw new service.OrganizationError(403, "Your role does not permit this invitation.");
  }
  // Resolve real recipient accounts on the server; this catches invitations to existing members.
  const email = data.email.toLowerCase();
  const recipients = await clerkClient.users.getUserList({ emailAddress: [email], limit: 100 });
  res.status(201).json(await service.inviteMember(id(req), user(res), email, data.role, recipients.data.map((u) => u.id)));
}));
router.delete("/organizations/:organizationId/invitations/:invitationId", safe(async (req, res) => {
  await service.revokeInvitation(id(req), user(res), String(req.params.invitationId)); res.json(action(req));
}));
router.post("/organizations/:organizationId/leave", safe(async (req, res) => {
  await service.leaveOrganization(id(req), user(res)); res.json(action(req));
}));
router.post("/organizations/:organizationId/transfer", safe(async (req, res) => {
  const data = TransferOrganizationOwnershipBody.strict().parse(req.body);
  await service.transferOwnership(id(req), user(res), data.userId, data.confirmation); res.json(action(req));
}));
router.post("/organizations/:organizationId/archive", safe(async (req, res) => {
  const data = ArchiveOrganizationBody.strict().parse(req.body);
  await service.archiveOrganization(id(req), user(res), data.confirmation); res.json(action(req));
}));
router.get("/organizations/:organizationId/audit", safe(async (req, res) => res.json(await service.listAudit(id(req), user(res)))));
router.post("/invitations/accept", safe(async (req, res) => {
  const data = AcceptOrganizationInvitationBody.strict().parse(req.body);
  const account = await clerkClient.users.getUser(user(res));
  const verified = account.emailAddresses.filter((e) => e.verification?.status === "verified").map((e) => e.emailAddress);
  res.json(await service.acceptInvitation(user(res), data.token, verified));
}));
router.get("/workspace", safe(async (_req, res) => res.json(await service.getWorkspace(user(res)))));
router.patch("/workspace", safe(async (req, res) => {
  const data = SelectWorkspaceBody.strict().parse(req.body);
  res.json(await service.selectWorkspace(user(res), data.organizationId));
}));
export default router;
