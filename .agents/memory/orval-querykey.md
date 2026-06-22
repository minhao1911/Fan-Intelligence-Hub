---
name: Orval queryKey required in query options
description: Orval-generated React Query hooks require queryKey when passing any query option object
---

## The rule

When passing the `query` options object to an Orval-generated hook, `queryKey` is always required:

```typescript
// WRONG — TypeScript error: Property 'queryKey' is missing
useListMatches({ status: "live" }, { query: { refetchInterval: 10_000 } });

// CORRECT — use the generated queryKey getter
const params = { status: "live", limit: 1 } as const;
useListMatches(params, { query: { queryKey: getListMatchesQueryKey(params), refetchInterval: 10_000 } });
```

Each hook `useFoo(params)` has a companion `getFooQueryKey(params)` exported from the same package.

**Why:** The Orval-generated hook types use `UseQueryOptions` from TanStack Query v5, where `queryKey` is required. The hook only auto-inserts it when no `query` options are passed at all.

**How to apply:** Any time you add `{ query: { ... } }` as the second arg to an Orval hook, import and use the corresponding `getXxxQueryKey(params)` getter. Also, `refetchInterval` must be inside `{ query: { ... } }` not at the top level of the options object.
