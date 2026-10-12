---
name: Workspace test bundling
description: Running Node tests that import workspace TypeScript packages
---
Bundle workspace source and transitive dependencies together for standalone Node test runs rather than externalizing all packages.

**Why:** Externalizing workspace packages exposes extensionless TypeScript directory imports to Node ESM; externalizing their dependencies alone can leave packages inaccessible from the test artifact under pnpm isolation. A CommonJS bundle avoids these two resolution boundaries.

**How to apply:** For small Node test suites using esbuild, bundle to CommonJS and externalize only optional native drivers.
