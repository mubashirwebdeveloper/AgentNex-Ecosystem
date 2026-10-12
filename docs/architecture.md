# AGENTNEX foundation

## Current boundaries

React/Vite serves the browser experience at `/`; Express serves `/api`. PostgreSQL and Drizzle persist profiles, provider identifiers, onboarding and preferences. Clerk owns authentication and password recovery; no local passwords or custom session tokens are stored. Browser API calls use same-origin cookies.

The OpenAPI contract generates frontend hooks and validation schemas. Routes authenticate before reading or writing data and use only the session's immutable user ID. Initialization uses a primary-key conflict-safe insert. Profile changes are serialized per profile using a transaction and row lock, preventing partial onboarding updates from bypassing completion rules. Inputs reject unknown keys, validate lengths/enums and check timezone identifiers. Errors do not expose database details. No user listing or public profile API exists.

The dashboard measures only the current account's completion. Its globe is an ecosystem concept, not a live network. The saved language is a preference, not a promise that all interface copy has been translated.

## Database changes

`lib/db/src/schema` is the source of truth. `lib/db/drizzle` records generated SQL migrations. Development schema is applied with `pnpm --filter @workspace/db run push`; the initial schema was applied without reset or seeded accounts. Do not replay the initial SQL on an already-pushed database. Do not add startup-time DDL or production migration scripts. The managed Publish flow handles production schema differences.

## Future modules

Organizations, agents/passports, verification, business connections, marketplace, RFQs/quotes, workflows/approvals, A2A messaging, API keys, usage, billing and administration are intentionally not operational.

Add future features as separate route/service/schema modules. Extend OpenAPI first and regenerate before consuming types. Add migrations without deleting existing data. Organizations should use an organization table plus membership joins referencing the immutable profile identity, with explicit server-side permission checks on every organization-scoped operation. Never infer ownership from a client-supplied organization ID. Personal accounts must continue to work without memberships.

Agent capabilities and permissions should be separate from identity. Trust claims should carry their issuer, evidence and expiry rather than boolean marketing claims. RFQs, workflow execution and marketplace purchases require durable state transitions, authorization and audit events before exposing operational controls. Billing is deferred; no payment processor is connected.

## Verification boundaries

The Node suite checks idempotent/concurrent initialization, database persistence, owner-specific writes, empty account progress and invalid input handling using temporary test records. HTTP smoke checks assert unauthenticated API requests return 401. These checks do not substitute for an interactive provider signup, email verification, recovery and logout test. The screenshot browser cannot sign in, and no authentication bypass is permitted.
