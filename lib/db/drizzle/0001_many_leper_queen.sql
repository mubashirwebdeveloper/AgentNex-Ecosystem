CREATE TABLE "organizations" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"type" text NOT NULL,
	"country" text NOT NULL,
	"website" text DEFAULT '' NOT NULL,
	"owner_user_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "organizations_slug_unique" UNIQUE("slug"),
	CONSTRAINT "organizations_type_check" CHECK ("organizations"."type" in ('business','agency','startup','enterprise','other'))
);
--> statement-breakpoint
CREATE TABLE "organization_memberships" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"user_id" text NOT NULL,
	"role" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "membership_role_check" CHECK ("organization_memberships"."role" in ('owner','admin','member','viewer'))
);
--> statement-breakpoint
CREATE TABLE "organization_invitations" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"email" text NOT NULL,
	"role" text NOT NULL,
	"token_hash" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"invited_by" text NOT NULL,
	"accepted_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "organization_invitations_token_hash_unique" UNIQUE("token_hash"),
	CONSTRAINT "invitation_role_check" CHECK ("organization_invitations"."role" in ('admin','member','viewer')),
	CONSTRAINT "invitation_status_check" CHECK ("organization_invitations"."status" in ('pending','accepted','revoked','expired'))
);
--> statement-breakpoint
CREATE TABLE "organization_audit_events" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"actor_user_id" text,
	"action" text NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workspace_contexts" (
	"user_id" text PRIMARY KEY NOT NULL,
	"organization_id" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_owner_user_id_profiles_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_memberships" ADD CONSTRAINT "organization_memberships_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_memberships" ADD CONSTRAINT "organization_memberships_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_invitations" ADD CONSTRAINT "organization_invitations_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_invitations" ADD CONSTRAINT "organization_invitations_invited_by_profiles_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_invitations" ADD CONSTRAINT "organization_invitations_accepted_by_profiles_id_fk" FOREIGN KEY ("accepted_by") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_audit_events" ADD CONSTRAINT "organization_audit_events_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_audit_events" ADD CONSTRAINT "organization_audit_events_actor_user_id_profiles_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_contexts" ADD CONSTRAINT "workspace_contexts_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_contexts" ADD CONSTRAINT "workspace_contexts_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "organizations_owner_idx" ON "organizations" USING btree ("owner_user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "membership_org_user_unique" ON "organization_memberships" USING btree ("organization_id","user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "membership_one_owner" ON "organization_memberships" USING btree ("organization_id") WHERE "organization_memberships"."role" = 'owner';--> statement-breakpoint
CREATE INDEX "membership_user_idx" ON "organization_memberships" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "invitation_pending_email_unique" ON "organization_invitations" USING btree ("organization_id","email") WHERE "organization_invitations"."status" = 'pending';--> statement-breakpoint
CREATE INDEX "organization_audit_org_time_idx" ON "organization_audit_events" USING btree ("organization_id","created_at");