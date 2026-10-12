import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { profiles } from "./profiles";
import { organizations } from "./organizations";

export const workspaceContexts = pgTable("workspace_contexts", {
  userId: text("user_id").primaryKey().references(() => profiles.id, { onDelete: "cascade" }),
  organizationId: text("organization_id").references(() => organizations.id, { onDelete: "set null" }),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
