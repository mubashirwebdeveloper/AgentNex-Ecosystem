import { pgTable, text, timestamp, jsonb, index } from "drizzle-orm/pg-core";
import { profiles } from "./profiles";
import { organizations } from "./organizations";

export const organizationAuditEvents = pgTable("organization_audit_events", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  actorUserId: text("actor_user_id").references(() => profiles.id, { onDelete: "set null" }),
  action: text("action").notNull(),
  metadata: jsonb("metadata").$type<Record<string, string>>().notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index("organization_audit_org_time_idx").on(t.organizationId, t.createdAt)]);
