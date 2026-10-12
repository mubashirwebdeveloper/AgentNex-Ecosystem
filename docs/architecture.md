# AGENTNEX foundation

## Current boundaries

React/Vite serves the browser experience at `/`; Express serves `/api`. PostgreSQL and Drizzle persist profiles, provider identifiers, onboarding and preferences. Clerk owns authentication and password recovery; no local passwords or custom session tokens are stored. Browser API calls use same-origin cookies.

The OpenAPI contract generates frontend hooks and validation schemas. Routes authenticate before reading or writing data and use only the session's immutable user ID. Initialization uses a primary-key conflict-safe insert. Profile changes are serialized per profile using a transaction and row lock, preventing partial onboarding updates from bypassing completion rules. Inputs reject unknown keys, validate lengths/enums and check timezone identifiers. Errors do not expose database details. No user listing or public profile API exists.

The personal dashboard measures only the current account's completion. Public globe illustrations are ecosystem concepts, not live network data. The saved language is a preference, not a promise that all interface copy has been translated.

## Database changes

`lib/db/src/schema` is the source of truth. `lib/db/drizzle` records generated SQL migrations. Development schema is applied with `pnpm --filter @workspace/db run push`; the initial schema was applied without reset or seeded accounts. Do not replay the initial SQL on an already-pushed database. Do not add startup-time DDL or production migration scripts. The managed Publish flow handles production schema differences.

## Future modules

Agents/passports, verification, business connections, marketplace, RFQs/quotes, workflows/approvals, A2A messaging, API keys, usage, billing and administration are intentionally not operational.

Add future features as separate route/service/schema modules. Extend OpenAPI first and regenerate before consuming types. Add migrations without deleting existing data. Never infer ownership from a client-supplied organization ID or selected workspace context. Personal accounts must continue to work without memberships.

## Organizations (Phase 2)

PostgreSQL organization memberships are authoritative; Clerk remains the identity/session
provider, not a second membership store. Every organization has one owner. Creation
inserts the organization and owner membership in one transaction. All administrative
mutations lock the organization row, then verify current membership and role through
the centralized organization service. Transfer demotes the previous owner to admin,
promotes an existing member and updates the owner reference in one transaction.
Members/viewers cannot administer; admins manage only member/viewer roles and cannot
perform ownership or archive actions. Unique organization/user and partial single-owner
indexes reinforce consistency. UUID-based slugs permit duplicate display names safely.

Invitations use 256-bit random tokens, SHA-256 hashes at rest, seven-day expiration,
single-use transactional acceptance, and recipient matching against Clerk's server-side
verified email records. No request-supplied email or role is trusted during acceptance.
Pending organization/email uniqueness prevents duplicates. Raw tokens are returned once
for manual sharing, never included in invitation lists/audits or persisted by the browser.
Request logging excludes query strings and bodies. No email delivery or logo-upload
integration is configured in the existing application; these are explicitly unavailable,
not simulated.

Workspace context is persisted separately from profiles and validated against current
active memberships. It never grants permissions. Removal, leaving and archiving clear
affected selected contexts; reads additionally reject inaccessible selections.
Archiving is the only exposed deletion strategy: owner-only, exact-name confirmation,
soft deletion, all member access removed, historical memberships/invitations/audits
retained. There is no public restoration or permanent-deletion endpoint.

Future organization-owned resources must use actual membership authorization, respect
archived status, and record real administrative events. Retain the mutation lock ordering
(organization before invitation/membership) to prevent stale-role and ownership races.

Agent capabilities and permissions should be separate from identity. Trust claims should carry their issuer, evidence and expiry rather than boolean marketing claims. RFQs, workflow execution and marketplace purchases require durable state transitions, authorization and audit events before exposing operational controls. Billing is deferred; no payment processor is connected.

## Verification boundaries

The Node suite checks idempotent/concurrent initialization, database persistence, owner-specific writes, empty account progress and invalid input handling using temporary test records. HTTP smoke checks assert unauthenticated API requests return 401. These checks do not substitute for an interactive provider signup, email verification, recovery and logout test. The screenshot browser cannot sign in, and no authentication bypass is permitted.
