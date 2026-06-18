# FanVerse

A football fan intelligence platform — not social media, not fantasy, not betting. FanVerse lets fans measure confidence, gauge matchday sentiment, and amplify their community's voice on the international stage.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080, proxied at /api)
- `pnpm --filter @workspace/fanverse run dev` — run the React frontend (port 22461, proxied at /)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite + Tailwind v4 + shadcn/ui + wouter
- Auth: Clerk (`@clerk/react` client, `@clerk/express` server)
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/db/src/schema/` — DB schema (users, nations, matches, polls/votes/reactions, discussions/comments)
- `artifacts/api-server/src/routes/` — API route handlers (users, nations, matches, discussions, stats)
- `artifacts/api-server/src/middlewares/` — Clerk proxy + requireAuth
- `artifacts/api-server/src/lib/` — userHelpers (getOrCreateUser, reputation tiers)
- `artifacts/fanverse/src/pages/` — all frontend pages
- `artifacts/fanverse/src/components/layout/AppLayout.tsx` — sidebar nav

## Architecture decisions

- Clerk auth via proxy: `@clerk/express` on server with `clerkProxyMiddleware`, `@clerk/react` + `@clerk/shared/keys` on frontend
- `publishableKeyFromHost` comes from `@clerk/shared/keys` (not `@clerk/react/internal` which doesn't export it in v6)
- Nation identity is central: users join one nation, earn reputation, get Nation Pulse analytics
- Reputation tiers: Casual (0pts) → Fan (50pts) → Capo (200pts) → Ultras (500pts)
- Poll votes (+5pts), reactions (+3pts), discussions (+8pts), comments (+2pts), joining a nation (+10pts)

## Product

- **Nation communities**: Join your nation's fanbase, see pulse metrics and member leaderboard
- **Match polls**: Cast confidence votes on upcoming matches, track real-time sentiment shifts
- **Nation Pulse**: Signature analytics — win/draw/loss confidence, fan mood score, top contributors
- **Match reactions**: Post-match emotional reactions (ecstatic → devastated) with optional comments
- **Community discussions**: Threaded forum with upvotes, tied to nations or specific matches
- **Fan reputation**: Earn points for engagement, climb tiers displayed across the platform
- **Global leaderboard**: Top fans ranked by reputation, filterable by nation

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- `@clerk/react` is the correct client package (v6). `@clerk/clerk-react` exists but is a different package.
- `publishableKeyFromHost` lives in `@clerk/shared/keys`, NOT in `@clerk/react/internal`
- `@clerk/themes/shadcn.css` requires `@clerk/themes` installed AND the `@layer theme, base, clerk, components, utilities;` declaration in CSS before `@import "tailwindcss"`
- Vite tailwind must have `optimize: false` for Clerk themes CSS to work in prod builds
- Always restart the api-server workflow after route changes (it rebuilds via esbuild)

## Seeded Data

- 24 nations across UEFA, CONMEBOL, CONCACAF, CAF, AFC with member counts and confidence scores
- 10 matches: upcoming (Copa America final, UEFA Nations League semis), live (MAR vs SEN), completed

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
