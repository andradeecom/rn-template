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

### Component layers (atomic design)
`src/components/` is split into `atoms/`, `molecules/`, `organisms/`, each with a barrel `index.ts` that re-exports named exports. When adding a component, add it to the matching folder's `index.ts`.

- **atoms**: primitive UI (`Text`, `Button`, `Input`, `Divider`, `Avatar`) — own their style variants (e.g. `Button` has `variant`/`size` props mapped to `StyleSheet.create` lookups).
- **molecules**: small compositions of atoms (e.g. `InputField`, `SocialButton`).
- **organisms**: screen-level sections composed from atoms/molecules (e.g. `LoginCard`, `LoginFooter`, `ProfileCard`).

Screens (`src/app/**`) compose organisms/atoms directly; they hold screen logic (handlers, mutations) and delegate presentation to organisms.

### Styling — react-native-unistyles
`src/unistyles.ts` defines the entire design system and must be imported once at app startup (it has no exports consumed elsewhere — its side effect of calling `StyleSheet.configure` is what matters). It exports a `light`/`dark` theme pair built from shared tokens (`font`, `spacing`, `radius`, `zIndex`, `opacity`) plus per-theme `colors` and `shadows`, and registers `UnistylesThemes`/`UnistylesBreakpoints` via module augmentation. Components style with `StyleSheet.create((theme) => ({...}))` from `react-native-unistyles`, never `react-native`'s `StyleSheet`. Always pull tokens off `theme` (`theme.spacing[4]`, `theme.colors.background`) rather than hardcoding values.

### Auth flow
Layered: `src/app/login.tsx` (screen) → `src/hooks/use-auth.ts` (React Query mutations/queries + Zustand writes) → `src/services/auth.ts` (`authApi`, raw HTTP calls) → `src/lib/api-client.ts` (axios instance).

- `useAuthStore` (`src/stores/auth.ts`, Zustand) holds `user`, `isAuthenticated`, `isHydrated` in memory. `hydrate()` reads the persisted token (`src/lib/secure-store.ts`, Expo SecureStore) and user (`src/lib/user-storage.ts`) on launch.
- `src/app/_layout.tsx` calls `hydrate()` once and gates navigation: while `!isHydrated` it shows a spinner; once hydrated, `useAuthGuard` redirects between `/login` and `/(tabs)` based on `isAuthenticated`.
- `api-client.ts` attaches the bearer token to every request and implements silent-refresh-on-401 with a request queue (so concurrent 401s only trigger one refresh call).
- Login/Google-login mutations persist the token + user (secure store + `user-storage`) and sync both the Zustand store and the React Query cache (`authKeys.me`) so `useMe()` doesn't have to refetch immediately.
- `useMockLogin` is a `__DEV__`-only escape hatch (wired into `src/app/login.tsx`) that signs in a hardcoded mock user without hitting the network — use this pattern for any other dev-only shortcuts.
- Logout clears secure store, stored user, cookies (`react-native-nitro-cookies`), the Zustand store, and the whole React Query cache.

### Forms & validation
React Hook Form + Zod, wired through `@hookform/resolvers`. Schemas live in `src/schemas/` as factory functions (`createLoginSchema()`, not a static export) because validation messages call `translate(...)` and need to read the current i18n locale at schema-creation time, not at module-load time.

### i18n
`src/i18n/` wraps `i18n-js`. `src/i18n/index.ts` barrels `i18n.ts` (instance config) and `translate.ts` (helper). Locale is set once in `src/app/_layout.tsx` from `expo-localization`'s `getLocales()`, with fallback enabled. Translation keys live per-locale in `src/i18n/translations/{en,es,pt}.ts`; add new keys to all three.

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
