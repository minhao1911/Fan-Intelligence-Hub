---
name: Clerk React Package Names
description: Correct package names, import paths, and setup gotchas for Clerk in a React + Vite frontend (v6)
---

## The rule

- Client package: `@clerk/react` (NOT `@clerk/clerk-react` — that's a different package)
- `publishableKeyFromHost` lives in `@clerk/react/internal` — NOT `@clerk/shared/keys`
  - The skill's canonical snippet (`setup-and-customization.md`) and the working code both use `@clerk/react/internal`
  - The older note in this file claiming `@clerk/shared/keys` was WRONG and has been corrected
- `shadcn` theme object: `import { shadcn } from "@clerk/themes"` — requires `@clerk/themes` installed separately
- `Show` component IS exported from `@clerk/react` — use it for conditional auth rendering

**Why:** `@clerk/react` v6 exports `publishableKeyFromHost` from its `internal` subpath. When the fallback key is a dev key (`pk_test_*`), the function returns it unchanged (pointing to the real Clerk FAPI, e.g. `bright-doe-73.clerk.accounts.dev`). If the env var is missing/empty at Vite startup, the function falls through to `buildPublishableKey('clerk.HOSTNAME')` which generates a non-existent subdomain → "Failed to load Clerk JS" error.

**How to apply:** Always call `setupClerkWhitelabelAuth()` BEFORE starting the frontend dev server (or restart the frontend workflow after provisioning). The `VITE_CLERK_PUBLISHABLE_KEY` must be baked in by Vite at dev-server startup.

## Correct imports

```typescript
import { ClerkProvider, SignIn, SignUp, Show, useClerk } from "@clerk/react";
import { publishableKeyFromHost } from "@clerk/react/internal";
import { shadcn } from "@clerk/themes";
```

## "Failed to load Clerk JS" root cause

`publishableKeyFromHost(window.location.hostname, import.meta.env.VITE_CLERK_PUBLISHABLE_KEY)` from `@clerk/react/internal`:
- If `VITE_CLERK_PUBLISHABLE_KEY` is a `pk_test_*` key → returns it unchanged ✅
- If `VITE_CLERK_PUBLISHABLE_KEY` is empty/undefined → returns `buildPublishableKey('clerk.HOSTNAME')` → loads from `clerk.REPLID.pike.replit.dev` which doesn't exist ❌

Fix: run `setupClerkWhitelabelAuth()` then restart `artifacts/fanverse: web` workflow.

## CSS setup (Tailwind v4)

```css
@layer theme, base, clerk, components, utilities;
@import "tailwindcss";
@import "@clerk/themes/shadcn.css";
```

Also set `tailwindcss({ optimize: false })` in vite.config.ts for prod builds.
