import * as SecureStore from 'expo-secure-store';
import type { StoragePort } from './ports';

/**
 * Keystore-backed storage: Keychain on iOS, Keystore-backed
 * EncryptedSharedPreferences on Android.
 *
 * This is where credentials go — session ids, CSRF tokens, OAuth token pairs.
 * It is the mobile counterpart of an httpOnly cookie: the app can use the value
 * without other processes being able to read it. `deviceStorage` is plain
 * unencrypted files inside the app sandbox, readable on a rooted or
 * jailbroken device and out of an unencrypted backup, so it must never hold a
 * credential.
 */

/**
 * Requires the device to have been unlocked at least once since boot, and the
 * value never syncs to iCloud or transfers to a new device.
 */
const OPTIONS: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
};

/**
 * Values are split across numbered keys rather than written whole.
 *
 * Expo enforces no size limit of its own, but the platform underneath does:
 * some iOS releases reject values above roughly 2048 bytes, and the rejection
 * arrives as a **native throw**, not a silent no-op. For a credential write
 * that is a bad failure — the token is simply never persisted, and the user
 * appears to be logged out at random some time later, far from the cause.
 *
 * An OAuth session carrying custom claims can reach that size, so chunking is
 * applied defensively. The cut is at a fixed offset and knows nothing about the
 * value's structure: a JWT is sliced mid-token and rejoined byte-for-byte,
 * never parsed or split on its separators.
 */
const CHUNK_SIZE = 1800;

/** Chunk count lives under the base key; `${key}.0`, `${key}.1`, … hold the parts. */
const chunkKey = (key: string, index: number) => `${key}.${index}`;

async function removeChunks(key: string, from: number, to: number): Promise<void> {
  const removals = [];
  for (let i = from; i < to; i += 1) {
    removals.push(SecureStore.deleteItemAsync(chunkKey(key, i), OPTIONS));
  }
  await Promise.all(removals);
}

function readCount(header: string | null): number | null {
  if (header === null) return null;

  const count = Number.parseInt(header, 10);
  return Number.isInteger(count) && count >= 0 ? count : null;
}

export const secureStorage: StoragePort = {
  get: async (key) => {
    const count = readCount(await SecureStore.getItemAsync(key, OPTIONS));
    if (count === null) return null;

    // Zero chunks is a legitimately empty string, not a missing key. The
    // distinction matters because a caller may write `''` deliberately, and
    // reading it back as null would look like corruption.
    if (count === 0) return '';

    const parts = await Promise.all(
      Array.from({ length: count }, (_, i) => SecureStore.getItemAsync(chunkKey(key, i), OPTIONS))
    );

    // A missing part means a torn write or a partial clear. Reporting the value
    // as absent is the safe read: a caller re-authenticates, where handing it a
    // truncated credential would fail in a much more confusing way.
    if (parts.some((part) => part === null)) return null;

    return parts.join('');
  },

  set: async (key, value) => {
    const previousCount = readCount(await SecureStore.getItemAsync(key, OPTIONS));

    const chunks: string[] = [];
    for (let i = 0; i < value.length; i += CHUNK_SIZE) {
      chunks.push(value.slice(i, i + CHUNK_SIZE));
    }

    await Promise.all(chunks.map((chunk, i) => SecureStore.setItemAsync(chunkKey(key, i), chunk, OPTIONS)));

    // The header is written last, so a crash mid-write leaves the previous
    // count in place and the read path sees a missing part rather than a
    // plausible-looking mixture of old and new.
    await SecureStore.setItemAsync(key, String(chunks.length), OPTIONS);

    // Drop parts left over from a longer previous value, or a later read would
    // splice the tail of the old value onto the new one.
    if (previousCount !== null && previousCount > chunks.length) {
      await removeChunks(key, chunks.length, previousCount);
    }
  },

  remove: async (key) => {
    const count = readCount(await SecureStore.getItemAsync(key, OPTIONS));

    await SecureStore.deleteItemAsync(key, OPTIONS);
    if (count !== null && count > 0) await removeChunks(key, 0, count);
  },
};
