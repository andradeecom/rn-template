import { createClient, type SupabaseClient, type SupportedStorage } from '@supabase/supabase-js';
import { secureStorage } from '@/lib/storage';

export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
export const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

/**
 * Adapts the app's storage port to the shape the Supabase SDK expects.
 *
 * The SDK asks for `getItem`/`setItem`/`removeItem`; the port speaks
 * `get`/`set`/`remove`. That rename is the entire adapter — where the bytes
 * actually land, and how a value too large for the keystore is split up, is
 * `@/lib/storage`'s business and deliberately not visible here.
 */
const sdkStorage: SupportedStorage = {
  getItem: (key) => secureStorage.get(key),
  setItem: (key, value) => secureStorage.set(key, value),
  removeItem: (key) => secureStorage.remove(key),
};

let client: SupabaseClient | null = null;

/**
 * The Supabase client, created on first use rather than at import.
 *
 * `createClient` throws when the URL is missing, and `container.ts` imports
 * *every* provider to build its registry — so constructing eagerly would crash
 * an app on launch merely for having Supabase compiled in, even when
 * `EXPO_PUBLIC_API_PROVIDER=api` and the credentials are deliberately unset.
 * Deferring means an unconfigured Supabase only fails if something actually
 * calls it, and the message says which variables are missing.
 */
export function getSupabaseClient(): SupabaseClient {
  if (client) return client;

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error(
      'Supabase is not configured. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY, ' +
        'or set EXPO_PUBLIC_API_PROVIDER="api" to use the REST backend.'
    );
  }

  // The token pair goes to the keystore, not AsyncStorage — Supabase's default
  // in React Native — because a refresh token is a long-lived credential.
  //
  // `detectSessionInUrl` is a web-redirect mechanism with no meaning in a
  // native app: emailed links arrive as deep links and are exchanged
  // explicitly by the adapter instead.
  client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      storage: sdkStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });

  return client;
}

/** Drops the memoized client. Test-only, so one spec cannot leak into the next. */
export function resetSupabaseClient(): void {
  client = null;
}
