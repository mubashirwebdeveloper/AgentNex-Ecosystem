import { Router, type IRouter } from "express";
import { getAuth } from "@clerk/express";
import { rateLimit } from "express-rate-limit";
import { db, profiles } from "@workspace/db";
import { eq } from "drizzle-orm";
import { GetMeResponse, UpdateProfileBody, UpdatePreferencesBody, GetDashboardResponse } from "@workspace/api-zod";
import { initializeProfile, dashboardFor, profileValidationError } from "../lib/profile-service";

const router: IRouter = Router();
router.use("/me", (req, res, next) => {
  const id = getAuth(req).userId;
  if (!id) { res.status(401).json({ error: "Sign in to access your account." }); return; }
  res.locals.userId = id;
  res.setHeader("Cache-Control", "no-store");
  next();
});
router.use("/me", rateLimit({
  windowMs: 60_000, limit: 120, standardHeaders: "draft-7", legacyHeaders: false,
  keyGenerator: (_req, res) => res.locals.userId as string,
  message: { error: "Too many requests. Please try again shortly." },
}));
router.get("/me", async (_req, res): Promise<void> => {
  const profile = await initializeProfile(res.locals.userId);
  res.json(GetMeResponse.parse({ ...profile, createdAt: profile.createdAt.toISOString() }));
});
router.get("/me/dashboard", async (_req, res): Promise<void> => {
  res.json(GetDashboardResponse.parse(dashboardFor(await initializeProfile(res.locals.userId))));
});
router.patch("/me", async (req, res): Promise<void> => {
  const parsed = UpdateProfileBody.strict().safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid profile fields.", fields: parsed.error.flatten().fieldErrors }); return; }
  const data = parsed.data;
  for (const key of ["displayName", "country", "timezone", "description"] as const) {
    if (data[key] !== undefined) data[key] = data[key].trim();
  }
  await initializeProfile(res.locals.userId);
  const result = await db.transaction(async (tx) => {
    const [current] = await tx.select().from(profiles).where(eq(profiles.id, res.locals.userId)).for("update");
    const error = profileValidationError({ ...current!, ...data });
    if (error) return { error };
    const [saved] = await tx.update(profiles).set({ ...data, updatedAt: new Date() }).where(eq(profiles.id, res.locals.userId)).returning();
    return { saved: saved! };
  });
  if (result.error) { res.status(400).json({ error: result.error }); return; }
  res.json(GetMeResponse.parse({ ...result.saved, createdAt: result.saved!.createdAt.toISOString() }));
});
router.patch("/me/preferences", async (req, res): Promise<void> => {
  const parsed = UpdatePreferencesBody.strict().safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid preferences." }); return; }
  await initializeProfile(res.locals.userId);
  const [saved] = await db.update(profiles).set({ ...parsed.data, updatedAt: new Date() }).where(eq(profiles.id, res.locals.userId)).returning();
  res.json(GetMeResponse.parse({ ...saved, createdAt: saved!.createdAt.toISOString() }));
});
export default router;
