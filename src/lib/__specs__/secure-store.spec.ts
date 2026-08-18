import * as SecureStore from 'expo-secure-store';
import {
  getSessionId,
  setSessionId,
  removeSessionId,
  getCsrfToken,
  setCsrfToken,
  removeCsrfToken,
} from '@/lib/secure-store';

/**
 * The session id is the whole credential on mobile, so where it is stored is
 * the security property worth pinning.
 *
 * SecureStore is Keychain-backed on iOS and Keystore-backed on Android.
 * AsyncStorage — used elsewhere in the app for the profile — is plain
 * unencrypted files, readable on a rooted device or out of an unencrypted
 * backup. These specs exist so a future refactor cannot quietly move the
 * credential to the wrong store or loosen its accessibility class.
 */
const mocked = SecureStore as jest.Mocked<typeof SecureStore>;

describe('session id storage', () => {
  beforeEach(() => jest.clearAllMocks());

  it('reads and writes through SecureStore, not AsyncStorage', async () => {
    mocked.getItemAsync.mockResolvedValue('stored-id');

    await expect(getSessionId()).resolves.toBe('stored-id');
    expect(mocked.getItemAsync).toHaveBeenCalledWith('session_id', expect.any(Object));

    await setSessionId('new-id');
    expect(mocked.setItemAsync).toHaveBeenCalledWith('session_id', 'new-id', expect.any(Object));
  });

  /*
   * AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY means the value is unavailable until
   * the device has been unlocked once since boot, never syncs to iCloud, and
   * does not transfer to a new device via backup. A weaker class (ALWAYS, or
   * one without THIS_DEVICE_ONLY) would let the credential leave the device.
   */
  it.each([
    ['read', () => getSessionId()],
    ['write', () => setSessionId('x')],
    ['delete', () => removeSessionId()],
  ])('scopes the %s to this device, after first unlock', async (_label, call) => {
    await call();

    const options = [
      ...mocked.getItemAsync.mock.calls,
      ...mocked.setItemAsync.mock.calls,
      ...mocked.deleteItemAsync.mock.calls,
    ].map((args) => args[args.length - 1]);

    expect(options[0]).toEqual({
      keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
    });
  });

  it('deletes the id rather than blanking it', async () => {
    await removeSessionId();

    expect(mocked.deleteItemAsync).toHaveBeenCalledWith('session_id', expect.any(Object));
    expect(mocked.setItemAsync).not.toHaveBeenCalled();
  });
});

describe('CSRF token storage', () => {
  beforeEach(() => jest.clearAllMocks());

  // Not a credential — it only round-trips to the server — but it is kept in
  // the same store so the two are cleared together and cannot drift apart.
  it('lives beside the session id under its own key', async () => {
    mocked.getItemAsync.mockResolvedValue('tok');

    await expect(getCsrfToken()).resolves.toBe('tok');
    expect(mocked.getItemAsync).toHaveBeenCalledWith('csrf_token', expect.any(Object));

    await setCsrfToken('tok2');
    expect(mocked.setItemAsync).toHaveBeenCalledWith('csrf_token', 'tok2', expect.any(Object));

    await removeCsrfToken();
    expect(mocked.deleteItemAsync).toHaveBeenCalledWith('csrf_token', expect.any(Object));
  });
});
