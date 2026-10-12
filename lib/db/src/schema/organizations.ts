import { pgTable, text, timestamp, index, check } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { profiles } from "./profiles";

export const organizations = pgTable("organizations", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  type: text("type").$type<"business" | "agency" | "startup" | "enterprise" | "other">().notNull(),
  country: text("country").notNull(),
  website: text("website").notNull().default(""),
  ownerUserId: text("owner_user_id").notNull().references(() => profiles.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
}, (t) => [
  index("organizations_owner_idx").on(t.ownerUserId),
  check("organizations_type_check", sql`${t.type} in ('business','agency','startup','enterprise','other')`),
]);
export type OrganizationRecord = typeof organizations.$inferSelect;
