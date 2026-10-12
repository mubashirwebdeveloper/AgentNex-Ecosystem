---
name: Organization ownership and identity boundaries
description: Durable Phase 2 decisions that future organization-owned modules must preserve
---

Clerk is the identity/session provider; PostgreSQL memberships are authoritative for
organization permissions. Do not add a parallel provider-organization membership store
without an explicit migration decision. Selected workspace context is only a preference,
never an authorization credential.

**Why:** The requested multi-tenant foundation must preserve existing immutable Clerk
identities and avoid inconsistent permission sources as future modules are added.

**How to apply:** Authorize future organization-owned resources against current database
membership and archived status, not client context or provider metadata.

Use one current owner per organization. Ownership changes are explicit atomic transfers,
with the previous owner becoming admin. Deletion means confirmed archiving with historical
records retained, not physical deletion through the app.

**Why:** Conservative ownership and retention rules prevent ownerless workspaces and
unnecessary loss of audit or future dependent data.

**How to apply:** Future modules must preserve these safety boundaries; changing ownership
cardinality or deletion semantics requires a deliberate product decision.
