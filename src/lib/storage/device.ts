import AsyncStorage from '@react-native-async-storage/async-storage';
import type { StoragePort } from './ports';

/**
 * Ordinary device storage, backed by AsyncStorage.
 *
 * Plain unencrypted files inside the app sandbox — readable on a rooted or
 * jailbroken device and out of an unencrypted backup — so this holds only
 * non-sensitive values: the cached profile, the chosen language, UI
 * preferences. Credentials belong in `secureStorage`.
 *
 * The obvious future here is MMKV, which is roughly 30x faster and synchronous.
 * Swapping it in means reimplementing this one file: the port is async, so a
 * synchronous backend is wrapped rather than propagated, and no caller changes.
 * Note MMKV's own `encryptionKey` does not make it a `secureStorage`
 * replacement — the key has to be persisted somewhere itself, which is what the
 * keystore is for.
 */
export const deviceStorage: StoragePort = {
  /**
   * `?? null` normalizes the `undefined` some AsyncStorage paths resolve to,
   * so the port's "null means absent" rule holds for both backends.
   */
  get: async (key) => (await AsyncStorage.getItem(key)) ?? null,

  set: async (key, value) => {
    await AsyncStorage.setItem(key, value);
  },

  /**
   * The `await` is what makes this resolve to `undefined`. AsyncStorage's own
   * `removeItem` resolves to `null`, and returning that directly would make
   * `remove` disagree with `secureStorage` on a value callers may well check.
   */
  remove: async (key) => {
    await AsyncStorage.removeItem(key);
  },
};
