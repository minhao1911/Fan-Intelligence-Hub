---
name: Clerk React Package Names
description: Correct package names and import paths for Clerk in a React + Vite frontend (v6)
---

## The rule

- Client package: `@clerk/react` (NOT `@clerk/clerk-react` — that's a different package)
- `publishableKeyFromHost` lives in `@clerk/shared/keys` — NOT `@clerk/react/internal` (which doesn't export it in v6)
- `shadcn` theme object: `import { shadcn } from "@clerk/themes"` — requires `@clerk/themes` installed separately
- `Show` component IS exported from `@clerk/react` — use it for conditional auth rendering

**Why:** Design subagents trained on older Clerk docs use `@clerk/clerk-react` and `@clerk/react/internal`. Both exist as packages but don't export the expected symbols in v6. Wasted significant debugging time on this.

**How to apply:** When setting up Clerk auth on a React frontend, always install `@clerk/react`, `@clerk/shared`, and `@clerk/themes` separately. Import `publishableKeyFromHost` from `@clerk/shared/keys`.

## Correct imports

```typescript
import { ClerkProvider, SignIn, SignUp, Show, useClerk } from "@clerk/react";
import { publishableKeyFromHost } from "@clerk/shared/keys";
import { shadcn } from "@clerk/themes";
```

## CSS setup (Tailwind v4)

```css
@layer theme, base, clerk, components, utilities;
@import "tailwindcss";
@import "@clerk/themes/shadcn.css";  // only if using shadcn theme
```

Also set `tailwindcss({ optimize: false })` in vite.config.ts for prod builds.
