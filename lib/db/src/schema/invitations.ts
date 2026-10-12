import { pgTable, text, timestamp, uniqueIndex, check } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { profiles } from "./profiles";
import { organizations } from "./organizations";

export const organizationInvitations = pgTable("organization_invitations", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  email: text("email").notNull(),
  role: text("role").$type<"admin" | "member" | "viewer">().notNull(),
  tokenHash: text("token_hash").notNull().unique(),
  status: text("status").$type<"pending" | "accepted" | "revoked" | "expired">().notNull().default("pending"),
  invitedBy: text("invited_by").notNull().references(() => profiles.id),
  acceptedBy: text("accepted_by").references(() => profiles.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  uniqueIndex("invitation_pending_email_unique").on(t.organizationId, t.email).where(sql`${t.status} = 'pending'`),
  check("invitation_role_check", sql`${t.role} in ('admin','member','viewer')`),
  check("invitation_status_check", sql`${t.status} in ('pending','accepted','revoked','expired')`),
]);
