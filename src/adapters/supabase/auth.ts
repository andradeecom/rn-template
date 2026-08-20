import type { AuthPort } from '@/adapters/ports';

/**
 * Raised by every method on the Supabase adapter until it is implemented.
 *
 * A named error rather than a bare `throw`: selecting an unimplemented provider
 * is a configuration mistake, and it should read as one at the call site
 * instead of surfacing as a generic failure inside a React Query mutation.
 */
export class ProviderNotImplementedError extends Error {
  constructor(method: string) {
    super(
      `The Supabase adapter does not implement "${method}" yet. ` +
        `Set EXPO_PUBLIC_API_PROVIDER="api" to use the REST backend, or implement this method.`
    );
    this.name = 'ProviderNotImplementedError';
  }
}

const notImplemented = (method: string) => () => Promise.reject(new ProviderNotImplementedError(method));

/**
 * Supabase provider — contract shape only, no live calls.
 *
 * Its purpose today is to prove the port is satisfiable by something other than
 * the REST backend, and to fix the mapping before anyone writes the code. Each
 * stub is annotated with the `@supabase/supabase-js` v2 call that replaces it.
 *
 * Two differences to respect when implementing, because they are where a
 * careless port breaks:
 *
 * 1. **The credential is a JWT pair, not an opaque id.** `signInWithPassword`
 *    returns `{ session }` in the response body, with an access token that
 *    expires and a refresh token that renews it. That pair belongs in
 *    SecureStore — the same keystore the REST session id uses, never
 *    AsyncStorage — and stays inside this adapter. The port returns `{ user }`
 *    only, so nothing above this layer learns which credential model is live.
 *
 * 2. **`User` is this app's type, not Supabase's.** A Supabase user carries its
 *    profile in `user_metadata` and has no `role` or `mustChangePassword`
 *    column. Mapping is a real translation — likely a `profiles` table read —
 *    not a cast. Do it here so `@/types/auth` stays the single domain shape.
 */
export const supabaseAuthAdapter: AuthPort = {
  /** `auth.signInWithPassword({ email, password })` — persist `data.session`, return the mapped user. */
  login: notImplemented('login'),

  /** `auth.signUp({ email, password, options: { data: { firstName, lastName } } })`. */
  register: notImplemented('register'),

  /** `auth.resetPasswordForEmail(email, { redirectTo })` — redirectTo must be the app's deep link. */
  forgotPassword: notImplemented('forgotPassword'),

  /**
   * `auth.updateUser({ password })`, but only after the recovery link's token has
   * established a session — Supabase resets are session-based, not token-in-body,
   * so the emailed link has to be exchanged first.
   */
  resetPassword: notImplemented('resetPassword'),

  /**
   * `auth.updateUser({ password })` while signed in. Supabase does not verify the
   * current password, so honoring `currentPassword` means re-authenticating with
   * `signInWithPassword` first.
   */
  changePassword: notImplemented('changePassword'),

  /** `auth.verifyOtp({ token_hash, type: 'email' })`. */
  verifyEmail: notImplemented('verifyEmail'),

  /** `auth.resend({ type: 'signup', email })`. */
  resendVerification: notImplemented('resendVerification'),

  /** `auth.signInWithIdToken({ provider: 'google', token: idToken })`. */
  googleLogin: notImplemented('googleLogin'),

  /** `auth.getUser()`, then map onto this app's `User` — see the note above. */
  me: notImplemented('me'),

  /** `auth.signOut()` — defaults to the local scope. */
  logout: notImplemented('logout'),

  /** `auth.signOut({ scope: 'global' })`, which revokes every refresh token. */
  logoutAll: notImplemented('logoutAll'),

  /**
   * Drops the stored token pair without calling Supabase.
   *
   * Unlike the others this one resolves rather than throwing. It runs on the
   * failure paths — a rejected credential, a logout whose network call did not
   * land — where the caller's whole intent is to end up signed out locally. A
   * throw there would leave the app stuck holding a credential it has already
   * decided to discard.
   */
  clearSession: async () => {},
};
