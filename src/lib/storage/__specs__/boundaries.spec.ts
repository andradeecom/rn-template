import { deviceStorage, secureStorage } from '@/lib/storage';
import * as secureStore from '@/lib/secure-store';
import * as userStorage from '@/lib/user-storage';

jest.mock('@/lib/storage', () => ({
  secureStorage: { get: jest.fn(), set: jest.fn(), remove: jest.fn() },
  deviceStorage: { get: jest.fn(), set: jest.fn(), remove: jest.fn() },
}));

/**
 * Each domain module must reach its own side of the port, and only its own.
 *
 * Sending a credential to `deviceStorage` writes it to unencrypted files
 * readable on a rooted device or out of a backup — the exact mistake the split
 * exists to prevent, and one that is invisible in review because both calls
 * look identical at the call site.
 */
const secure = secureStorage as jest.Mocked<typeof secureStorage>;
const device = deviceStorage as jest.Mocked<typeof deviceStorage>;

beforeEach(() => jest.clearAllMocks());

describe('credentials go to secure storage', () => {
  it.each([
    ['read', () => secureStore.getSessionId()],
    ['write', () => secureStore.setSessionId('id')],
    ['delete', () => secureStore.removeSessionId()],
  ])('never touches device storage on %s', async (_label, call) => {
    await call();

    expect(device.get).not.toHaveBeenCalled();
    expect(device.set).not.toHaveBeenCalled();
    expect(device.remove).not.toHaveBeenCalled();
  });

  it('writes the session id to the keystore', async () => {
    await secureStore.setSessionId('id');

    expect(secure.set).toHaveBeenCalledWith('session_id', 'id');
  });

  it('writes the CSRF token to the keystore', async () => {
    await secureStore.setCsrfToken('tok');

    expect(secure.set).toHaveBeenCalledWith('csrf_token', 'tok');
  });
});

describe('the cached profile goes to device storage', () => {
  // Not a credential, and it can outgrow the keystore's comfortable size —
  // but equally it must not be the thing anyone reaches for out of habit when
  // storing a token.
  it('writes the profile to device storage, not the keystore', async () => {
    await userStorage.setStoredUser({ id: 'u1', email: 'a@b.com' } as never);

    expect(device.set).toHaveBeenCalledWith('user_data', expect.stringContaining('u1'));
    expect(secure.set).not.toHaveBeenCalled();
  });
});
