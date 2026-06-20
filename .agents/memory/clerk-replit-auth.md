---
name: Clerk auth in Replit dev environment
description: Clerk session cookies don't work in Replit dev; all API calls must use Bearer tokens via setAuthTokenGetter.
---

## Rule
In Replit's dev environment, Clerk's `__session` cookie is scoped to `localhost` but the browser accesses the app via `https://xxxx.repl.co`. The cookie is never sent with API requests → every protected endpoint returns 401.

**Fix:** Register `setAuthTokenGetter` from `@workspace/api-client-react` in a top-level component so all generated hooks attach `Authorization: Bearer <token>`:

```tsx
// In App.tsx, inside ClerkProvider + QueryClientProvider:
function ClerkAuthInjector() {
  const { getToken } = useAuth();
  useEffect(() => {
    setAuthTokenGetter(() => getToken());
    return () => setAuthTokenGetter(null);
  }, [getToken]);
  return null;
}
```

Place `<ClerkAuthInjector />` early inside `<QueryClientProvider>` so it mounts before any hooks fire.

**Why:** Cookie domain mismatch is structural in Replit's proxy setup. Bearer tokens bypass it completely. The `customFetch` in `@workspace/api-client-react` already supports this via `setAuthTokenGetter`.

**How to apply:** Any time `/api/me` or other auth-gated endpoints return 401 in dev despite the user being signed in — this is the cause.
