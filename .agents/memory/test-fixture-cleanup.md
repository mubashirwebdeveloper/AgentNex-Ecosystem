---
name: Authenticated browser fixture cleanup
description: Order cleanup so in-flight browser requests cannot recreate deleted test profiles
---

Finish all browser activity and remove the exact synthetic Clerk identities before
the final database-profile cleanup. Do not assume an earlier profile deletion remains
final while an authenticated verification browser is still making requests.

**Why:** Synthetic profiles reappeared when a live browser made authenticated initialization
requests after the first database cleanup. Provider deletion and browser shutdown must
precede the final profile cleanup.

**How to apply:** Use only exact recorded synthetic IDs, verify identity before provider
deletion, and perform final scoped database cleanup after all browser work is finished.
Never use broad deletion by name prefix or remove preexisting users.
