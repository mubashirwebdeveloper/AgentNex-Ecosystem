import { pgTable, text, integer, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";

export const profiles = pgTable("profiles", {
  id: text("id").primaryKey(),
  displayName: text("display_name").notNull().default(""),
  accountType: text("account_type").$type<"individual" | "business" | "developer">().notNull().default("individual"),
  country: text("country").notNull().default(""),
  timezone: text("timezone").notNull().default(""),
  language: text("language").$type<"en" | "es" | "fr" | "de" | "ar" | "ur" | "zh">().notNull().default("en"),
  description: text("description").notNull().default(""),
  onboardingStep: integer("onboarding_step").notNull().default(0),
  onboardingCompleted: boolean("onboarding_completed").notNull().default(false),
  theme: text("theme").$type<"dark" | "light">().notNull().default("dark"),
  widgets: jsonb("widgets").$type<{ account: boolean; checklist: boolean; network: boolean }>().notNull().default({ account: true, checklist: true, network: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertProfileSchema = createInsertSchema(profiles).omit({ createdAt: true, updatedAt: true });
export type ProfileRecord = typeof profiles.$inferSelect;
