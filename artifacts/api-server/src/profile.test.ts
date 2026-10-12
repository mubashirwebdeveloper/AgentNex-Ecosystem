import { test, after } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { db, pool, profiles } from "@workspace/db";
import { eq, inArray } from "drizzle-orm";
import { UpdateProfileBody, UpdatePreferencesBody } from "@workspace/api-zod";
import { initializeProfile, dashboardFor, profileValidationError } from "./lib/profile-service";

const ids = [`test_${randomUUID()}`, `test_${randomUUID()}`];
after(async () => {
  await db.delete(profiles).where(inArray(profiles.id, ids));
  await pool.end();
});
test("profile initialization is idempotent, including concurrent requests", async () => {
  await Promise.all(Array.from({ length: 5 }, () => initializeProfile(ids[0]!)));
  const rows = await db.select().from(profiles).where(eq(profiles.id, ids[0]!));
  assert.equal(rows.length, 1);
  assert.equal(rows[0]!.onboardingCompleted, false);
});
test("empty account dashboard needs no organization and has no invented activity", async () => {
  const dashboard = dashboardFor(await initializeProfile(ids[1]!));
  assert.equal(dashboard.profileCompletion, 0);
  assert.deepEqual(dashboard.checklist.map((item) => item.completed), [true, false, false]);
});
test("profile, onboarding, theme and widgets persist independently for each owner", async () => {
  await initializeProfile(ids[0]!);
  await initializeProfile(ids[1]!);
  await db.update(profiles).set({
    displayName: "Test account", country: "Canada", timezone: "America/Toronto",
    description: "A test description", onboardingStep: 3, onboardingCompleted: true,
    theme: "light", widgets: { account: false, checklist: true, network: false },
  }).where(eq(profiles.id, ids[0]!));
  const account = await initializeProfile(ids[0]!);
  assert.equal(account.displayName, "Test account");
  assert.equal(account.theme, "light");
  assert.equal(account.onboardingCompleted, true);
  assert.equal(account.onboardingStep, 3);
  assert.equal(account.widgets.network, false);
  assert.equal(dashboardFor(account).profileCompletion, 100);
  assert.equal((await initializeProfile(ids[1]!)).displayName, "");
});
test("input validation rejects unknown ownership fields and invalid settings", () => {
  assert.equal(UpdateProfileBody.strict().safeParse({ id: "other-user" }).success, false);
  assert.equal(UpdateProfileBody.safeParse({ displayName: "x".repeat(81) }).success, false);
  assert.equal(UpdateProfileBody.safeParse({ accountType: "admin" }).success, false);
  assert.equal(UpdatePreferencesBody.safeParse({ theme: "invalid" }).success, false);
  assert.equal(UpdatePreferencesBody.safeParse({ widgets: { account: true } }).success, false);
});
test("draft onboarding permits blanks but completion and timezones are validated", () => {
  const draft = { displayName: "", country: "", timezone: "", onboardingCompleted: false };
  assert.equal(profileValidationError(draft), null);
  assert.notEqual(profileValidationError({ ...draft, onboardingCompleted: true }), null);
  assert.notEqual(profileValidationError({ ...draft, timezone: "Not/AZone" }), null);
  assert.equal(profileValidationError({ displayName: "Person", country: "Canada", timezone: "America/Toronto", onboardingCompleted: true }), null);
});
