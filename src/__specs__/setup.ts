/**
 * Runs after the jest-expo preset has set up the environment.
 *
 * The preset mocks the native half of the Expo SDK, but not the modules this
 * app talks to directly. `expo-secure-store` is backed by the Keychain and
 * Keystore, and `react-native-nitro-cookies` by a native cookie jar — neither
 * exists in a Node test process, so both are replaced here rather than in
 * every spec that transitively imports the api client.
 */
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
  AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY: 'afterFirstUnlockThisDeviceOnly',
}));

jest.mock('react-native-nitro-cookies', () => ({
  default: { clearAll: jest.fn() },
}));

// AsyncStorage ships its own mock; use that rather than hand-rolling one. The
// require is deliberate: jest.mock factories are hoisted above imports, so a
// top-level import of the mock would not exist yet when this runs.
jest.mock('@react-native-async-storage/async-storage', () =>
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);
