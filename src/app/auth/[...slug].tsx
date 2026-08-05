import { Redirect, useGlobalSearchParams, useLocalSearchParams } from 'expo-router';

/**
 * Bridges the `/auth/*` links the backend puts in emails onto the real routes,
 * which live in the `(auth)` layout group and so resolve without the prefix
 * (`/auth/verify-email?token=x` → `/verify-email?token=x`).
 *
 * Keeping this shim means the backend's `FRONTEND_URL` can stay shared with the
 * web client instead of needing a mobile-specific path scheme.
 */
export default function AuthLinkRedirect() {
  const { slug } = useLocalSearchParams<{ slug?: string | string[] }>();
  // Query params (`?token=...`) live on the global params, not the route params.
  const { token } = useGlobalSearchParams<{ token?: string }>();

  const segments = Array.isArray(slug) ? slug : slug ? [slug] : [];
  const target = segments.join('/');

  const allowed = ['verify-email', 'reset-password', 'forgot-password', 'register', 'login'] as const;
  const isKnown = (allowed as readonly string[]).includes(target);

  if (!isKnown) {
    return <Redirect href="/login" />;
  }

  return <Redirect href={{ pathname: `/${target}` as '/verify-email', params: token ? { token } : {} }} />;
}
