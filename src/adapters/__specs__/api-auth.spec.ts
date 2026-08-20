import { apiAuthAdapter } from '@/adapters/api';
import { authApi } from '@/services/auth';
import { clearLocalSession } from '@/lib/api-client';

/**
 * The REST adapter is a binding, so what is worth testing is that the wiring is
 * right — that each port method reaches the service call of the same name.
 *
 * A crossed wire here is a genuinely nasty bug: `logout` bound to `logoutAll`
 * would silently sign the user out of every device, and both would pass a test
 * that only asserted "something was called".
 */
describe('api auth adapter', () => {
  it.each([
    'login',
    'register',
    'forgotPassword',
    'resetPassword',
    'changePassword',
    'verifyEmail',
    'resendVerification',
    'googleLogin',
    'me',
    'logout',
    'logoutAll',
  ] as const)('binds %s to the matching service call', (method) => {
    expect(apiAuthAdapter[method]).toBe(authApi[method]);
  });

  // Not a service call — the local-only clear lives on the api client, and is
  // what the 401 path and the logout hooks reach through the port.
  it('binds clearSession to the api client local clear', () => {
    expect(apiAuthAdapter.clearSession).toBe(clearLocalSession);
  });
});
