---
name: Clerk v6 Signal API
description: How useSignIn/useSignUp work in @clerk/react v6 — destructuring pattern and method names
---

## The rule

`useSignIn()` returns `SignInSignalValue` — NOT the `SignInResource` directly:
```typescript
const { signIn, errors, fetchStatus } = useSignIn();
// signIn: SignInFutureResource
// fetchStatus: 'idle' | 'fetching'
const isLoaded = fetchStatus !== 'fetching';
```

`useSignUp()` returns `SignUpSignalValue`:
```typescript
const { signUp, errors, fetchStatus } = useSignUp();
```

`setActive` must come from `useClerk()`, not from the signal hooks.

## SignInFutureResource key methods
- `signIn.create(params)` → `Promise<{ error: ClerkError | null }>`
- `signIn.status` — 'needs_identifier' | 'needs_first_factor' | 'complete' | etc.
- `signIn.createdSessionId` — string | null (set when status === 'complete')

## SignUpFutureResource key methods
- `signUp.create(params)` → `Promise<{ error: ClerkError | null }>`
- `signUp.verifications.sendEmailCode()` → `Promise<{ error: ClerkError | null }>`
- `signUp.verifications.verifyEmailCode({ code })` → `Promise<{ error: ClerkError | null }>`
- `signUp.status` — 'missing_requirements' | 'complete' | etc.
- `signUp.createdSessionId` — string | null (set when status === 'complete')
- `signUp.finalize()` — sets newly created session as active

**Why:** Clerk v6 moved from returning resources directly to returning signal values that wrap the resource. This is a major API change from v5. The old pattern `const { signIn, isLoaded } = useSignIn()` no longer works.

**How to apply:** Any sign-in/sign-up custom flow code must destructure `{ signIn, fetchStatus }` (not `{ signIn, isLoaded }`) from the respective hooks.
