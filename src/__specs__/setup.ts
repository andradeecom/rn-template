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

// `__esModule` matters: the api client imports this module's *default* export,
// and with esModuleInterop on, the interop helper only unwraps `.default` when
// the flag is present. Without it the mock object itself is handed over as the
// default and `NitroCookies.clearAll` is undefined at the call site.
jest.mock('react-native-nitro-cookies', () => ({
  __esModule: true,
  default: { clearAll: jest.fn() },
}));

// AsyncStorage ships its own mock; use that rather than hand-rolling one. The
// require is deliberate: jest.mock factories are hoisted above imports, so a
// top-level import of the mock would not exist yet when this runs.
jest.mock('@react-native-async-storage/async-storage', () =>
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);
