import { createClient, type SupabaseClient, type SupportedStorage } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';

export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
export const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

/**
 * Same keychain scoping as the REST session id: available after first unlock,
 * never synced to iCloud, never transferred to a new device.
 */
const OPTIONS: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
};

/**
 * SecureStore rejects values above 2048 bytes. A Supabase session is normally
 * well under that, but custom claims push the JWT up and the limit is reached
 * silently — `setItemAsync` throws and the session is simply never persisted,
 * which surfaces much later as an unexplained logout.
 *
 * Values are therefore chunked across numbered keys. The count lives under the
 * base key so a read knows how many parts to reassemble, and so a shrinking
 * value cannot leave a longer previous write behind as garbage.
 */
const CHUNK_SIZE = 1800;

async function clearChunks(key: string, count: number): Promise<void> {
  const removals = [];
  for (let i = 0; i < count; i += 1) {
    removals.push(SecureStore.deleteItemAsync(`${key}.${i}`, OPTIONS));
  }
  await Promise.all(removals);
}

/**
 * Storage the Supabase client persists its token pair through.
 *
 * Supabase defaults to AsyncStorage in React Native, which is unencrypted files
 * inside the app sandbox — readable on a rooted device or out of an unencrypted
 * backup. The refresh token is a long-lived credential, so it belongs in the OS
 * keystore exactly like the REST provider's session id.
 */
export const secureStorage: SupportedStorage = {
  getItem: async (key) => {
    const header = await SecureStore.getItemAsync(key, OPTIONS);
    if (header === null) return null;

    const count = Number.parseInt(header, 10);
    if (!Number.isInteger(count) || count < 0) return null;

    // A zero-chunk value is a legitimately empty string, not a missing key —
    // distinguishing them matters because the SDK writes `''` to mean "no
    // session" and reading that back as null would look like corruption.
    if (count === 0) return '';

    const parts = await Promise.all(
      Array.from({ length: count }, (_, i) => SecureStore.getItemAsync(`${key}.${i}`, OPTIONS))
    );

    // A missing chunk means a partially-written or partially-cleared value.
    // Treating it as absent is the safe read: the SDK re-authenticates rather
    // than parsing a truncated session.
    if (parts.some((part) => part === null)) return null;

    return parts.join('');
  },

  setItem: async (key, value) => {
    const previous = await SecureStore.getItemAsync(key, OPTIONS);

    const chunks: string[] = [];
    for (let i = 0; i < value.length; i += CHUNK_SIZE) {
      chunks.push(value.slice(i, i + CHUNK_SIZE));
    }
    // An empty value still needs a header written, or the key reads as absent.

    await Promise.all(chunks.map((chunk, i) => SecureStore.setItemAsync(`${key}.${i}`, chunk, OPTIONS)));
    await SecureStore.setItemAsync(key, String(chunks.length), OPTIONS);

    // Drop chunks left over from a longer previous value, or a later read would
    // reassemble a mix of both.
    const previousCount = previous === null ? 0 : Number.parseInt(previous, 10);
    if (Number.isInteger(previousCount) && previousCount > chunks.length) {
      const stale = [];
      for (let i = chunks.length; i < previousCount; i += 1) {
        stale.push(SecureStore.deleteItemAsync(`${key}.${i}`, OPTIONS));
      }
      await Promise.all(stale);
    }
  },

  removeItem: async (key) => {
    const header = await SecureStore.getItemAsync(key, OPTIONS);
    const count = header === null ? 0 : Number.parseInt(header, 10);

    await SecureStore.deleteItemAsync(key, OPTIONS);
    if (Number.isInteger(count) && count > 0) await clearChunks(key, count);
  },
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

  // `detectSessionInUrl` is a web-redirect mechanism with no meaning in a
  // native app — emailed links arrive as deep links and are exchanged
  // explicitly by the adapter instead.
  client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      storage: secureStorage,
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
