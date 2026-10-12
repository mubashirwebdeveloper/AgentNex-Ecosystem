# AGENTNEX

The Global Network for AI Agents, Businesses & People — Phase 1 identity and personal workspace foundation.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/agentnex run dev` — frontend, through its managed workflow
- `pnpm --filter @workspace/api-server run test` — automated validation and isolated PostgreSQL persistence tests
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/agentnex/src/` — public website, authentication pages and personal workspace
- `artifacts/api-server/src/routes/me.ts` — authenticated own-account endpoints
- `artifacts/api-server/src/lib/profile-service.ts` — idempotent initialization and completion rules
- `lib/api-spec/openapi.yaml` — API contract; regenerate clients after edits
- `lib/db/src/schema/profiles.ts` — current schema
- `lib/db/drizzle/` — versioned SQL schema history; development schema applied through Drizzle push
- `docs/architecture.md` — extension conventions and security boundaries

## Architecture decisions

- React/Vite selected explicitly by the user instead of the brief's preferred Next.js. One Express backend avoids mixing stacks.
- Clerk owns registration, sessions, logout and account recovery. App records use immutable Clerk user IDs, never email as identity.
- Personal accounts have no organization dependency. Future features remain truthful roadmap screens.
- Public theme preferences use local storage; signed-in preferences are stored in PostgreSQL.

## Product

Phase 1: public ecosystem explanation, account access, resumable onboarding, profile editing, personal progress dashboard, saved widget preferences and settings.

## User preferences

The reference image describes the future vision. Do not fabricate metrics, customers, listings, activity, transactions or AI execution. Do not start Prompt 2 until requested.

## Gotchas

- All private endpoints derive ownership exclusively from the authenticated session. Never accept a user ID from request bodies.
- Do not run schema DDL or seed data on server startup. Publishing manages the production schema separately.
- Tests use temporary randomly named test profiles, and clean up only those profiles.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
