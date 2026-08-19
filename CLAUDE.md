# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Expo + React Native + TypeScript starter template (`rn-template`). Entry point is `src/index.ts`, routing is file-based via `expo-router` (`src/app/`). Uses pnpm as package manager.

## Commands

```bash
pnpm start              # expo start (dev server)
pnpm ios                # expo run:ios
pnpm android            # expo run:android
pnpm web                # expo start --web
pnpm lint               # expo lint
pnpm format             # prettier --write "**/*.{ts,tsx,js,jsx}"
pnpm update:deps        # expo install --check (use instead of manually bumping deps)
pnpm clean-install      # scripts/clean-and-reinstall.sh — wipes node_modules/lockfile and reinstalls
```

There is no test runner configured in this template.

Husky + lint-staged run `prettier --write` and `expo lint --fix` on staged `*.{js,jsx,ts,tsx}` files on every commit (`.husky/pre-commit`). Node version is pinned via `.nvmrc` (24.17.0); `engines.node` in `package.json` requires `>= 24.17.0`.

## Architecture

### Path aliases
`@/*` maps to `src/*`, `@/assets/*` maps to `assets/*` (see `tsconfig.json`). Always import via `@/...`, never relative paths across top-level folders.

### Navigation
`src/app/` holds the file-based routes; `src/navigation/` holds the navigator components those routes mount (currently `RootNavigator`). Keeping them apart stops `src/app/_layout.tsx` — which Expo Router treats as a route file — from accumulating hydration, guard, and stack-configuration logic.

### Component layers (atomic design)
`src/components/` is split into `atoms/`, `molecules/`, `organisms/`, each with a barrel `index.ts` that re-exports named exports. When adding a component, add it to the matching folder's `index.ts`.

- **atoms**: primitive UI (`Text`, `Button`, `Input`, `Divider`, `Avatar`) — own their style variants (e.g. `Button` has `variant`/`size` props mapped to `StyleSheet.create` lookups).
- **molecules**: small compositions of atoms (e.g. `InputField`, `SocialButton`) plus `AuthScreenLayout`, the shared SafeArea/KeyboardAvoiding/ScrollView shell every `(auth)` screen wraps itself in.
- **organisms**: screen-level sections composed from atoms/molecules (e.g. `LoginCard`, `RegisterCard`, `ForgotPasswordCard`, `ResetPasswordCard`, `LoginFooter`, `ProfileCard`). `AuthMessageCard` is the shared terminal state (icon + title + message + up to two actions, `tone: success | error | info`) that the auth flows resolve to instead of each screen rolling its own confirmation view.

Auth organisms own their form (`useForm` + resolver + `Controller`s) and take plain callbacks as props; the screen owns the mutation and navigation. Follow that split rather than passing `react-hook-form` objects across the boundary.

Screens (`src/app/**`) compose organisms/atoms directly; they hold screen logic (handlers, mutations) and delegate presentation to organisms.

### Styling — react-native-unistyles
`src/unistyles.ts` defines the entire design system and must be imported once at app startup (it has no exports consumed elsewhere — its side effect of calling `StyleSheet.configure` is what matters). It exports a `light`/`dark` theme pair built from shared tokens (`font`, `spacing`, `radius`, `zIndex`, `opacity`) plus per-theme `colors` and `shadows`, and registers `UnistylesThemes`/`UnistylesBreakpoints` via module augmentation. Components style with `StyleSheet.create((theme) => ({...}))` from `react-native-unistyles`, never `react-native`'s `StyleSheet`. Always pull tokens off `theme` (`theme.spacing[4]`, `theme.colors.background`) rather than hardcoding values.

### Auth flow
Layered: `src/app/(auth)/*.tsx` (screens) → `src/hooks/use-auth.ts` (React Query mutations/queries + Zustand writes) → `src/services/auth.ts` (`authApi`, raw HTTP calls) → `src/lib/api-client.ts` (axios instance).

All unauthenticated screens live in the `src/app/(auth)/` layout group: `login`, `register`, `forgot-password`, `reset-password`, `verify-email`. Because `(auth)` is a group, it does **not** appear in the URL — the routes resolve as `/login`, `/register`, etc.

- `useAuthStore` (`src/stores/auth.ts`, Zustand) holds `user`, `isAuthenticated`, `isHydrated` in memory. `hydrate()` reads the persisted session id (`src/lib/secure-store.ts`, Expo SecureStore) and user (`src/lib/user-storage.ts`) on launch. A stored id only means a session *may* still be live — it is opaque, so only the server can confirm it.
- `src/app/_layout.tsx` stays thin — it only configures `i18n-js` fallback behavior and mounts providers (`QueryClientProvider`, `Toast`) around `<RootNavigator />`. The active locale itself is applied by `useHydrate()` (`useLocaleStore`), not here — see [docs/internationalization.md](docs/internationalization.md). Navigation lives in `src/navigation/RootNavigator.tsx`: it calls `useHydrate()`, holds a spinner until hydration finishes, then renders the top-level `Stack`. Put new root-level screen registrations there, not in `_layout.tsx`.
- `useHydrate` and `useAuthGuard` live in `src/hooks/use-auth.ts` alongside the rest of the auth surface. `useAuthGuard` sends unauthenticated users anywhere outside `(auth)` to `/login`, and authenticated users inside `(auth)` to `/(tabs)`. It keys off the `(auth)` group rather than `(tabs)` so there is no unrouted cold-start state (there is no `app/index.tsx`).
- Auth is an **opaque server-side session**, not a JWT. The credential is a random id the server issues as a `Set-Cookie`; it carries no claims and cannot be refreshed — when the server rejects it, the row is gone and the only correct move is to log in again.
- The id lives in the OS keystore (Keychain / Keystore-backed `EncryptedSharedPreferences`) via `secure-store.ts`, **never** AsyncStorage — that is unencrypted files, readable on a rooted device or from an unencrypted backup. `user-storage.ts` (AsyncStorage) holds only the non-sensitive profile.
- `api-client.ts` attaches the id explicitly as a `Cookie` header rather than relying on the ambient cookie jar, which is shared app-wide (WebViews included). Its response interceptor captures rotated ids out of `set-cookie` and re-persists them — **missing a rotation means presenting a revoked id next call, which the server treats as reuse and punishes by killing the whole session family.** On 401 it clears the local session.
- Login/Google-login mutations persist only the user; the session id is captured by the interceptor, so there is deliberately no token in the response body. They sync both the Zustand store and the React Query cache (`authKeys.me`) so `useMe()` doesn't have to refetch immediately.
- The backend also issues a readable `csrf_token` cookie and requires it echoed in `X-CSRF-Token` on mutations. A native app is not actually CSRF-exposed — it attaches its session by hand rather than having it sent ambiently — but the server applies one rule to all cookie-authenticated callers, so `api-client.ts` stores the token beside the session id and echoes it back.
- `useLogout` calls `POST /auth/logout` **before** clearing locally, so the session row is deleted server-side. Clearing only the device would leave the id usable by anyone who captured it. `useLogoutAll` does the same across every device. Both clear locally even if the network call fails.
- `useRegister`, `useForgotPassword`, `useResetPassword`, `useVerifyEmail`, `useResendVerification` deliberately **do not** touch the auth store or query cache — none of those endpoints return a session, so the user still has to log in afterwards.
- `useChangePassword` is the exception: it runs while signed in, so it refreshes the stored/cached user when the backend clears `mustChangePassword`.

#### Change password vs reset password
Two distinct flows, easy to conflate:
- **`/change-password`** (`src/app/change-password.tsx`, registered as a modal on the root stack, reached from the profile screen) — for a signed-in user. Posts `currentPassword` + new to `POST /auth/change-password`, no email involved. The current-password field is skipped when `user.mustChangePassword` is set, mirroring the backend rule for admin-created accounts on a temporary password; `createChangePasswordSchema(requireCurrent)` takes that same flag.
- **`/reset-password`** (in `(auth)`) — for a signed-out user who forgot their password. Token-only, reachable **exclusively** via the emailed deep link. Do not link to it from inside the app; there is no token to give it.
- Logout clears secure store, stored user, cookies (`react-native-nitro-cookies`), the Zustand store, and the whole React Query cache.

#### Deep links for emailed tokens
`reset-password` and `verify-email` read their single-use token from the URL via `useLocalSearchParams<{ token?: string }>()`, and both render a recoverable error state when it is absent or rejected. `verify-email` auto-submits on mount behind a `useRef` guard, since the token is single-use and a double fire would consume it.

The backend emails `{FRONTEND_URL}/auth/verify-email?token=…` (an `/auth`-prefixed path shared with the web client), which does not match the app's actual `/verify-email` route. `src/app/auth/[...slug].tsx` bridges the two: it whitelists the known auth paths and `<Redirect>`s to the real route, forwarding `token`. Query params come off `useGlobalSearchParams`, not `useLocalSearchParams`, in that shim. Keep the whitelist in sync when adding auth routes.

Deep links need the `scheme` in `app.json` (`rntemplate`) and, for tapping links straight from a mail client, universal links / app links configured per platform — not set up yet.

### Forms & validation
React Hook Form + Zod, wired through `@hookform/resolvers`. Schemas live in `src/schemas/` as factory functions (`createLoginSchema()`, not a static export) because validation messages call `translate(...)` and need to read the current i18n locale at schema-creation time, not at module-load time. Screens/organisms call the factory inside `useMemo(() => createXSchema(), [])`.

Cross-field rules use `.refine()` with an explicit `path` so the error lands on the right input (see `createRegisterSchema`'s password-match check writing to `confirmPassword`). Password minimums mirror the backend's 8-character floor on registration and reset — the login schema stays at 6 so existing accounts are not locked out.

### i18n
`src/i18n/` wraps `i18n-js`. `src/i18n/index.ts` barrels `i18n.ts` (instance config) and `translate.ts` (helper). Translation keys live per-locale in `src/i18n/translations/{en,es,pt}.ts`; add new keys to all three.

The active locale is owned by `useLocaleStore` (`src/stores/locale.ts`), not set once at startup — see [docs/internationalization.md](docs/internationalization.md) for persistence, the language switcher, and why render-scope translation must go through `useTranslation()` rather than the plain `translate()` (React Compiler memoizes `translate()`'s result per call-site, so it goes stale after a language change; `translate()` remains correct in event handlers).

### Data fetching
TanStack Query. `src/lib/query-client.ts` provides the single `queryClient` instance (provided via `QueryClientProvider` in `_layout.tsx`). Query keys are namespaced per domain as `const` objects (see `authKeys` in `use-auth.ts`) — follow that convention for new domains rather than inlining key arrays.

### Networking
All HTTP goes through the single `apiClient` axios instance (`src/lib/api-client.ts`); `API_BASE_URL` is hardcoded there (`http://localhost:3001/api`) pointing at a proprietary backend. Service modules (`src/services/*.ts`) wrap `apiClient` calls per domain and return typed data; hooks call services, never axios directly.

### Type/schema layout
Domain types live in `src/types/*.ts` (e.g. `User`, `LoginRequest`, `LoginResponse` in `types/auth.ts`), imported with `import type`. Keep request/response shapes here rather than inferring them from Zod schemas, since schemas are form-validation-only.

## Conventions

- ESLint config (`eslint.config.js`) is `eslint-config-expo` flat config + Prettier + `eslint-plugin-react-compiler` (recommended ruleset is enforced — write components compatible with the React Compiler, e.g. no manual memoization workarounds it would conflict with).
- Prettier: single quotes, semicolons, 120 print width, ES5 trailing commas, LF line endings (`.prettierrc`).
- Components/hooks/services follow named exports (no default exports except Expo Router screens, which require default export).
