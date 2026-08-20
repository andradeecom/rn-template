# Backend adapters

The app talks to a backend through a contract, not through a specific provider.
`src/adapters/` holds that seam so the provider can be swapped with a one-line
env change.

## Which architecture is this?

The contracts in `ports.ts` are **driven ports** in the Hexagonal Architecture
sense: the app declares what it needs, an outside actor implements it, and the
dependency arrow points inward. Clean Architecture calls the identical construct
an _output port_, and names its implementations gateways or repositories. Both
are Dependency Inversion applied at an architectural boundary — the structure
here is unchanged under either vocabulary, so read "port" as "the interface the
app owns and the provider satisfies."

What this is **not** is a full Clean Architecture interior. There are no
entities and no use-case interactors. React Query hooks in `src/hooks/` play the
use-case role directly, and framework types — mutations, Zustand stores, Expo
Router navigation — sit immediately above the boundary rather than behind a
further layer.

That is a deliberate trade. React Query already owns caching, retry, and
invalidation; wrapping it in framework-free interactors would mean
reimplementing those semantics to satisfy a layering rule. The inversion is
applied at the one boundary that actually changes — the backend provider — and
nowhere it would only add ceremony. If a domain ever grows orchestration worth
testing without React, that is the moment to introduce an interactor for _that_
domain, not a reason to pre-emptively layer all of them.

## Layout

```
src/adapters/
  ports.ts        # AuthPort — the contract every provider satisfies
  container.ts    # resolves the active provider; the DI seam
  index.ts        # barrel — import from '@/adapters'
  api/            # proprietary REST backend (default)
  supabase/       # stub only — contract shape, no live calls
```

## Selecting a provider

```bash
EXPO_PUBLIC_API_PROVIDER="api"       # default — the REST backend
EXPO_PUBLIC_API_PROVIDER="supabase"  # stub; every method rejects
```

An unrecognized value warns and falls back to `api` rather than throwing.
`EXPO_PUBLIC_*` is inlined at build time, so a typo cannot be fixed on a device
that already has the binary — a hard crash on launch would leave no way out,
while a warning plus a working default keeps the app usable and the mistake
visible.

## Using it

Resolve the port at call time:

```ts
import { getAuthPort } from '@/adapters';

const { user } = await getAuthPort().login({ email, password });
```

**Never destructure at module scope.** `const { login } = getAuthPort()` binds
the first provider permanently and silently ignores every later override — the
late binding is the entire point of the indirection.

In tests, install a double and restore afterwards:

```ts
setBackendAdapter(fakeAdapter);
afterEach(() => resetBackendAdapter());
```

## Why the credential is not on the contract

`login` resolves to `{ user }` and nothing more. The two providers authenticate
in fundamentally different ways:

|            | REST backend          | Supabase              |
| ---------- | --------------------- | --------------------- |
| Credential | opaque session id     | JWT + refresh token   |
| Delivery   | `Set-Cookie` header   | response body         |
| Renewal    | rotated by the server | refreshed by the SDK  |
| Revocation | row deleted           | refresh token revoked |

Putting a session on the contract would force hooks and stores to branch on the
shape of a credential they have no business reading. Instead each adapter
persists its own, internally — and nothing above the adapter layer can tell
which provider is live.

`clearSession` is the one credential-adjacent method on the port, because the
401 handler and the logout hooks genuinely need to discard whatever the active
adapter stored without knowing what that is. It resolves rather than rejecting
even on the unimplemented provider: it runs on paths where the caller has
already decided to be signed out, and throwing there would strand the app
holding a credential it has chosen to discard.

## Implementing the Supabase adapter

The stubs in `src/adapters/supabase/auth.ts` each name the
`@supabase/supabase-js` v2 call that replaces them. Two things to get right:

1. **Store the token pair in SecureStore**, never AsyncStorage — same reasoning
   as the REST session id (see [authentication.md](authentication.md)).
2. **Map Supabase's user onto this app's `User`.** Supabase keeps the profile in
   `user_metadata` and has no `role` or `mustChangePassword` — expect a
   `profiles` table read. This is a translation, not a cast, and it belongs in
   the adapter so `@/types/auth` stays the single domain shape.

Also note `resetPassword`: Supabase recovery is session-based rather than
token-in-body, so the emailed link must establish a session before
`updateUser({ password })` will work. The port's `ResetPasswordRequest` carries
a token, so the adapter has to bridge that difference.

## Adding a domain

Three edits, in order:

1. A port type in `ports.ts` (`BillingPort`, `ProfilePort`, …).
2. A sibling key on `BackendAdapter`.
3. An implementation in **every** provider — the compiler enforces this the
   moment the key is non-optional.

The contract test in `src/adapters/__specs__/ports.spec.ts` runs one suite per
registered adapter, so the new domain is covered for all providers at once. Add
its method names to that spec's method list: the list is written out literally
rather than derived from the type, because types vanish at runtime and a
`keyof` loop would only ever check the keys an adapter already has.

## Planned: a billing port

Payments are the natural next domain, and the one where this layer pays for
itself — provider lock-in is expensive and the SDKs agree on almost nothing.
The shape follows `AuthPort`'s rules exactly:

```ts
export type BillingPort = {
  getSubscription: () => Promise<Subscription | null>;
  listPlans: () => Promise<Plan[]>;
  startCheckout: (plan: PlanId) => Promise<CheckoutSession>;
  cancelSubscription: () => Promise<MessageResponse>;
  restorePurchases: () => Promise<Subscription | null>;
};
```

Written in the app's own types — `Subscription`, `Plan` in `src/types/billing.ts`
— never Stripe's `Stripe.Subscription` or RevenueCat's `CustomerInfo`. Same
reasoning as the auth credential: whatever leaks through the contract is what
every caller ends up coupled to.

### Billing is a separate axis from the backend

A Supabase backend with Stripe billing, or the REST backend with RevenueCat, are
both ordinary pairings. If billing varies independently, give it its own
variable and resolve it separately:

```bash
EXPO_PUBLIC_API_PROVIDER="api"
EXPO_PUBLIC_BILLING_PROVIDER="revenuecat"
```

Folding both into one `ProviderName` would force every backend/payment
combination to be enumerated as its own provider — four names for two choices,
and worse as either side grows.

### Two rules for whoever implements it

**Never trust the client for entitlement.** `getSubscription` returns what the
_server_ believes, not what the store SDK reports locally — a jailbroken device
can claim anything. This also keeps providers genuinely interchangeable: store
receipts are not portable between providers, but verified entitlement state is.

**Expect a store SDK, not a card processor.** App Store and Play Store policy
requires their IAP for digital goods, so a native billing adapter is usually
RevenueCat or Expo IAP. Stripe is the right implementation for web checkout or
physical goods — precisely the kind of swap this port exists to absorb.

`restorePurchases` is on the contract for that reason: it has no meaning for a
card processor, but it is a **store requirement** for IAP, and a port that
omitted it would make the compliant provider unimplementable.
