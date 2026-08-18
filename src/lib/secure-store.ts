import * as SecureStore from 'expo-secure-store';

/**
 * The session id lives in the OS keystore — Keychain on iOS, Keystore-backed
 * EncryptedSharedPreferences on Android — not in AsyncStorage.
 *
 * AsyncStorage is plain unencrypted files inside the app sandbox, readable on a
 * rooted/jailbroken device or out of an unencrypted device backup. SecureStore
 * is the mobile counterpart of an httpOnly cookie: the app can use the
 * credential without other processes being able to read it.
 */
const SESSION_KEY = 'session_id';
const CSRF_KEY = 'csrf_token';

/**
 * Requires the device to have been unlocked at least once since boot, and the
 * value never syncs to iCloud or transfers to a new device.
 */
const OPTIONS: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
};

export async function getSessionId(): Promise<string | null> {
  return SecureStore.getItemAsync(SESSION_KEY, OPTIONS);
}

export async function setSessionId(sessionId: string): Promise<void> {
  await SecureStore.setItemAsync(SESSION_KEY, sessionId, OPTIONS);
}

export async function removeSessionId(): Promise<void> {
  await SecureStore.deleteItemAsync(SESSION_KEY, OPTIONS);
}

/**
 * The CSRF token is not a credential — it only has to round-trip back to the
 * server — but it is kept alongside the session id so the two are cleared
 * together and never drift apart.
 */
export async function getCsrfToken(): Promise<string | null> {
  return SecureStore.getItemAsync(CSRF_KEY, OPTIONS);
}

export async function setCsrfToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(CSRF_KEY, token, OPTIONS);
}

export async function removeCsrfToken(): Promise<void> {
  await SecureStore.deleteItemAsync(CSRF_KEY, OPTIONS);
}
