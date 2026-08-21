import { Redirect, useGlobalSearchParams, useLocalSearchParams } from 'expo-router';

/**
 * Bridges the `/auth/*` links the backend puts in emails onto the real routes,
 * which live in the `(auth)` layout group and so resolve without the prefix
 * (`/auth/verify-email?token=x` → `/verify-email?token=x`).
 *
 * Keeping this shim means the backend's `FRONTEND_URL` can stay shared with the
 * web client instead of needing a mobile-specific path scheme.
 *
 * Providers disagree on the parameter name: the REST backend sends `token`,
 * while Supabase sends `token_hash` (plus a `type`). Both are accepted and
 * normalized to `token`, because the screens below are provider-agnostic — the
 * active adapter is what knows how to redeem the value. Reading only `token`
 * would silently drop every Supabase link onto an error state.
 */
export default function AuthLinkRedirect() {
  const { slug } = useLocalSearchParams<{ slug?: string | string[] }>();
  // Query params (`?token=...`) live on the global params, not the route params.
  const { token, token_hash: tokenHash } = useGlobalSearchParams<{ token?: string; token_hash?: string }>();
  const credential = token ?? tokenHash;

  const segments = Array.isArray(slug) ? slug : slug ? [slug] : [];
  const target = segments.join('/');

  const allowed = ['verify-email', 'reset-password', 'forgot-password', 'register', 'login'] as const;
  const isKnown = (allowed as readonly string[]).includes(target);

  if (!isKnown) {
    return <Redirect href="/login" />;
  }

  return (
    <Redirect href={{ pathname: `/${target}` as '/verify-email', params: credential ? { token: credential } : {} }} />
  );
}
