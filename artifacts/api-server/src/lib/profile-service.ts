import { db, profiles, type ProfileRecord } from "@workspace/db";
import { eq } from "drizzle-orm";

export async function initializeProfile(id: string): Promise<ProfileRecord> {
  await db.insert(profiles).values({ id }).onConflictDoNothing({ target: profiles.id });
  const [profile] = await db.select().from(profiles).where(eq(profiles.id, id));
  if (!profile) throw new Error("Profile initialization failed");
  return profile;
}

export function dashboardFor(profile: ProfileRecord) {
  const fields = [profile.displayName, profile.country, profile.timezone, profile.description];
  return {
    profileCompletion: Math.round(fields.filter((field) => field.trim()).length / fields.length * 100),
    checklist: [
      { id: "account", label: "Create your AGENTNEX account", completed: true, href: "/profile" },
      { id: "onboarding", label: "Set up your identity", completed: profile.onboardingCompleted, href: "/onboarding" },
      { id: "description", label: "Add your professional introduction", completed: Boolean(profile.description.trim()), href: "/profile" },
    ],
  };
}

export function profileValidationError(profile: Pick<ProfileRecord, "timezone" | "displayName" | "country" | "onboardingCompleted">): string | null {
  if (profile.timezone) {
    try { new Intl.DateTimeFormat("en", { timeZone: profile.timezone }); }
    catch { return "Choose a valid timezone."; }
  }
  if (profile.onboardingCompleted && (!profile.displayName.trim() || !profile.country.trim() || !profile.timezone.trim())) {
    return "Display name, country and timezone are required to complete onboarding.";
  }
  return null;
}
