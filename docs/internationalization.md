# Internationalization

Translations live in `src/i18n/translations/{en,es,pt}.ts`. `en` is the
fallback locale.

## Choosing and persisting a language

The active language lives in `useLocaleStore` (`src/stores/locale.ts`) and is
persisted to AsyncStorage (`src/lib/locale-storage.ts`) — a preference, not a
credential, so the keystore used for the session id would be the wrong home
for it.

- **First launch** falls back to the device language, matched on the base
  tag: `getDeviceLocale()` narrows a full tag like `pt-BR` to `pt` rather than
  missing it and dropping to English.
- **`useHydrate`** applies the stored preference before the first screen
  renders, so nothing flashes the wrong language on launch. Its initial state
  is a constant, never a call into `expo-localization` — Zustand runs a
  store's initializer at import time, before native modules are registered,
  so reaching for the device locale there crashes the app on startup with
  `TypeError: property is not writable` followed by `"main" has not been
  registered`. Hydration resolves the real value a moment later instead.

## Reading translations in a component

Two ways to call into `i18n-js`, and which one to use depends on whether the
call happens during render:

- **`useTranslation()`** (`src/hooks/use-locale.ts`) returns a `t` bound to
  the active language. Use this for anything computed during render. It
  subscribes to the locale, so a language change re-renders the component —
  and because `t` is derived from that reactive state, React Compiler
  recomputes its results instead of serving a stale memoized string.
- **`translate()`** (the plain `i18n-js` call) stays correct inside event
  handlers — Toast callbacks and the like — which run after a language change
  has already applied and read the current locale at call time. **Do not**
  call it during render: that is what caused stale strings in the first
  place (see below).

`useLocale()` returns `{ locale, setLocale }` — the value and setter, for
anything that needs to change or display the language itself rather than
translate a string.

### Why `translate()` during render went stale

`app.json` sets `experiments.reactCompiler: true`. The compiler memoizes a
function call by its arguments, on the assumption that the function is pure —
same arguments, same result, forever. `translate('login.title')` is called
with a constant string key, so the compiler computed it once and reused that
memoized value on every later render, including renders after `setLocale()`
changed the language. Only a full reload re-evaluated it, because that starts
memoization over.

`translate()` gives the compiler no way to know the result actually depends on
the current locale — nothing about the call signature reveals that dependency.
`useTranslation()` fixes this by closing over `locale` from a `useCallback`
dependency array, so the returned `t` is itself a new function reference on
every locale change. The compiler correctly treats a new function identity as
non-memoizable, so `t('login.title')` is recomputed rather than served from
cache.

The same problem existed one level up in the validation schemas:
`createLoginSchema()` embeds translated error messages, and call sites
originally wrapped it in `useMemo(() => createLoginSchema(), [])` — an empty
dependency array, so the schema (and its translated messages) was computed
once per mount and never again. The locale dependency was invisible to
`react-hooks/exhaustive-deps` as well, since nothing in the closure named it,
so the lint rule could not have caught the empty array either. The fix is to
drop the memoization and call `createXSchema()` directly on every render:
schema construction is cheap, and per-render creation makes the missing
reactivity a non-issue rather than a hidden one.

## `LanguageSwitcher`

A molecule (`src/components/molecules/LanguageSwitcher.tsx`), used on the
login screen and in the profile card. Wraps `@expo/ui`'s **universal**
`Picker` — imported from `@expo/ui` directly, not the `@expo/ui/community`
picker — inside a `Host`, which `@expo/ui` requires to render its native view
into the React tree. It renders as a SwiftUI menu on iOS and a Material 3
dropdown on Android: the platform-native control, rather than a hand-built
one, so it matches what users expect on each platform and is accessible
without extra work.

Language names are deliberately **not** translated — each renders in its own
language, so someone who has landed in a language they cannot read can still
find their own in the list.

## Adding a language

1. Add the locale to `SUPPORTED_LOCALES` in `src/i18n/i18n.ts`.
2. Add a translation file under `src/i18n/translations/`.
3. Add the language's own-language name to `LANGUAGE_NAMES` in
   `LanguageSwitcher.tsx`.
