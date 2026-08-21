/**
 * Key-value persistence, split by security guarantee rather than by library.
 *
 * Two named instances implement this: `secureStorage`, backed by the OS keystore
 * (Keychain / Keystore-backed EncryptedSharedPreferences), and `deviceStorage`,
 * backed by ordinary app-sandbox files. Which one a caller picks is a security
 * decision; which library sits behind it is not, and can change without callers
 * noticing — that is the point of the seam.
 *
 * Asynchronous on both sides even though a synchronous backend (MMKV) is a
 * plausible future for `deviceStorage`. A port cannot be made async later
 * without touching every call site, but a sync backend is trivially wrapped in
 * a resolved promise — so the cost is paid once, here, rather than by a
 * migration.
 */
export type StoragePort = {
  /** Resolves `null` when the key was never written, or its value is unreadable. */
  get: (key: string) => Promise<string | null>;
  set: (key: string, value: string) => Promise<void>;
  remove: (key: string) => Promise<void>;
};
