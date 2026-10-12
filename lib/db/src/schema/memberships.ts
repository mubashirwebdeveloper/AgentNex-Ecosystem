import { pgTable, text, timestamp, uniqueIndex, index, check } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { profiles } from "./profiles";
import { organizations } from "./organizations";

export type OrganizationRole = "owner" | "admin" | "member" | "viewer";
export const organizationMemberships = pgTable("organization_memberships", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => profiles.id),
  role: text("role").$type<OrganizationRole>().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  uniqueIndex("membership_org_user_unique").on(t.organizationId, t.userId),
  uniqueIndex("membership_one_owner").on(t.organizationId).where(sql`${t.role} = 'owner'`),
  index("membership_user_idx").on(t.userId),
  check("membership_role_check", sql`${t.role} in ('owner','admin','member','viewer')`),
]);
