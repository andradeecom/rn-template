import { clearLocalSession } from '@/lib/api-client';
import { getSessionId } from '@/lib/secure-store';
import { authApi } from '@/services/auth';
import type { AuthPort } from '@/adapters/ports';

/**
 * The proprietary REST backend, and the template's default provider.
 *
 * A thin binding rather than a reimplementation: `@/services/auth` already
 * speaks the domain types the port is written in, so this adapter mostly names
 * the mapping. The real work stays in `@/lib/api-client` — attaching the
 * session id as an explicit `Cookie` header, capturing rotated ids out of
 * `set-cookie`, and clearing on 401.
 *
 * The credential never surfaces here. `login` resolves to `{ user }` because
 * the session id arrives as a header and is written to the keystore by the
 * response interceptor before this promise settles.
 */
export const apiAuthAdapter: AuthPort = {
  login: authApi.login,
  register: authApi.register,
  forgotPassword: authApi.forgotPassword,
  resetPassword: authApi.resetPassword,
  changePassword: authApi.changePassword,
  verifyEmail: authApi.verifyEmail,
  resendVerification: authApi.resendVerification,
  googleLogin: authApi.googleLogin,
  me: authApi.me,
  logout: authApi.logout,
  logoutAll: authApi.logoutAll,

  /**
   * A keystored session id is the whole credential for this provider, so its
   * presence is the answer. Not proof the session is live — the id is opaque,
   * so only the server can confirm it, which `me()` does on mount.
   */
  hasSession: async () => (await getSessionId()) !== null,

  /**
   * Clears the keystored session id, the CSRF token, the stored profile and the
   * native cookie jar. Local only — callers that also need the server row gone
   * call `logout()` first, and deliberately still clear locally if it fails.
   */
  clearSession: clearLocalSession,
};
