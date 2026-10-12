CREATE TABLE "profiles" (
	"id" text PRIMARY KEY NOT NULL,
	"display_name" text DEFAULT '' NOT NULL,
	"account_type" text DEFAULT 'individual' NOT NULL,
	"country" text DEFAULT '' NOT NULL,
	"timezone" text DEFAULT '' NOT NULL,
	"language" text DEFAULT 'en' NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"onboarding_step" integer DEFAULT 0 NOT NULL,
	"onboarding_completed" boolean DEFAULT false NOT NULL,
	"theme" text DEFAULT 'dark' NOT NULL,
	"widgets" jsonb DEFAULT '{"account":true,"checklist":true,"network":true}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
