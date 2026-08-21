import type { AuthError } from '@supabase/supabase-js';
import type { AuthPort } from '@/adapters/ports';
import type { MessageResponse, User } from '@/types/auth';
import { getSupabaseClient } from './client';
import { toAuthError, toUser } from './mappers';

/**
 * Supabase provider.
 *
 * Two structural differences from the REST backend shape everything here:
 *
 * 1. **The credential is a JWT pair, not an opaque id.** `signInWithPassword`
 *    returns a session in the response body, and the SDK persists and refreshes
 *    it. That is kept inside this adapter — `client.ts` points the SDK at
 *    SecureStore — so the port can keep returning `{ user }` and nothing above
 *    it learns which credential model is live.
 *
 * 2. **Supabase has no profile columns.** `role`, `mustChangePassword`, and the
 *    name fields live in `user_metadata`, so every method maps through
 *    `toUser()` rather than casting.
 */

/**
 * Collapses Supabase's `{ data, error }` into a throw.
 *
 * Typed as a discriminated union rather than two independent fields, because
 * that is what the SDK actually returns: on the error branch every payload
 * field is `null`. Narrowing on `error` is what lets the caller treat `data` as
 * populated afterwards.
 */
function unwrap<T>(result: { data: T; error: null } | { data: unknown; error: AuthError }): T {
  if (result.error) throw toAuthError(result.error);
  return result.data as T;
}

const ok = (message: string): MessageResponse => ({ message });

/**
 * Supabase can return a null user on success — a signup awaiting email
 * confirmation, or a session read after expiry. Callers of the port are typed
 * against a non-null `User`, so the ambiguity is resolved here rather than
 * leaking outward as an optional.
 */
function requireUser(user: { id: string } | null, context: string): User {
  if (!user) throw new Error(`Supabase returned no user for ${context}`);
  return toUser(user as Parameters<typeof toUser>[0]);
}

export const supabaseAuthAdapter: AuthPort = {
  login: async ({ email, password }) => {
    const data = unwrap(await getSupabaseClient().auth.signInWithPassword({ email, password }));
    return { user: requireUser(data.user, 'login') };
  },

  /**
   * Registration deliberately does not sign the user in.
   *
   * With email confirmation disabled Supabase returns a live session here, which
   * would silently diverge from the REST provider's contract — the app expects
   * the user to log in afterwards. The session is discarded so both providers
   * behave identically.
   */
  register: async ({ email, password, firstName, lastName }) => {
    const data = unwrap(
      await getSupabaseClient().auth.signUp({
        email,
        password,
        options: { data: { firstName, lastName } },
      })
    );

    if (data.session) await getSupabaseClient().auth.signOut({ scope: 'local' });

    const user = requireUser(data.user, 'register');

    return {
      message: 'Registration successful. Check your email to confirm your account.',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        emailVerifiedAt: user.emailVerifiedAt,
      },
    };
  },

  forgotPassword: async ({ email }) => {
    const { error } = await getSupabaseClient().auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.EXPO_PUBLIC_APP_SCHEME ?? 'rntemplate'}://reset-password`,
    });
    if (error) throw toAuthError(error);

    // Deliberately unconditional, mirroring the REST backend: confirming
    // whether an address is registered would make this an account-enumeration
    // oracle.
    return ok('If that email is registered, a reset link is on its way.');
  },

  /**
   * Supabase password recovery is **session-based**, not token-in-body: the
   * emailed link carries a `token_hash` that must first be exchanged for a
   * session, after which the password is changed on the signed-in user. The
   * port's request carries a token, so the exchange happens here.
   *
   * The temporary recovery session is dropped afterwards, since the port
   * promises a reset does not sign the user in.
   */
  resetPassword: async ({ token, newPassword }) => {
    unwrap(await getSupabaseClient().auth.verifyOtp({ token_hash: token, type: 'recovery' }));

    const { error } = await getSupabaseClient().auth.updateUser({ password: newPassword });
    if (error) throw toAuthError(error);

    await getSupabaseClient().auth.signOut({ scope: 'local' });

    return ok('Your password has been reset. Please log in.');
  },

  /**
   * Supabase does not verify the current password on `updateUser`, so it is
   * re-checked explicitly by re-authenticating. Skipping that would let anyone
   * with a live session — a borrowed unlocked phone — change the password
   * without knowing the old one, which the REST backend does not allow.
   */
  changePassword: async ({ currentPassword, newPassword }) => {
    if (currentPassword) {
      const { data: current } = await getSupabaseClient().auth.getUser();
      const email = current.user?.email;
      if (!email) throw new Error('Not signed in');

      unwrap(await getSupabaseClient().auth.signInWithPassword({ email, password: currentPassword }));
    }

    const { error } = await getSupabaseClient().auth.updateUser({
      password: newPassword,
      data: { mustChangePassword: false },
    });
    if (error) throw toAuthError(error);

    return ok('Your password has been changed.');
  },

  /** The emailed link carries a `token_hash`, not the raw token. */
  verifyEmail: async ({ token }) => {
    unwrap(await getSupabaseClient().auth.verifyOtp({ token_hash: token, type: 'email' }));
    return ok('Your email has been verified.');
  },

  resendVerification: async ({ email }) => {
    const { error } = await getSupabaseClient().auth.resend({ type: 'signup', email });
    if (error) throw toAuthError(error);

    return ok('If that email is registered, a new confirmation link is on its way.');
  },

  googleLogin: async ({ idToken }) => {
    const data = unwrap(await getSupabaseClient().auth.signInWithIdToken({ provider: 'google', token: idToken }));
    return { user: requireUser(data.user, 'googleLogin') };
  },

  /**
   * `getUser()` rather than `getSession()`: the former revalidates against the
   * server, while the latter returns whatever is cached locally and would
   * happily report a revoked session as live.
   */
  me: async () => {
    const data = unwrap(await getSupabaseClient().auth.getUser());
    return requireUser(data.user, 'me');
  },

  logout: async () => {
    const { error } = await getSupabaseClient().auth.signOut({ scope: 'local' });
    if (error) throw toAuthError(error);

    return ok('Signed out.');
  },

  /** Revokes every refresh token the account holds, not just this device's. */
  logoutAll: async () => {
    const { error } = await getSupabaseClient().auth.signOut({ scope: 'global' });
    if (error) throw toAuthError(error);

    return ok('Signed out on all devices.');
  },

  /**
   * Present, not proven. `getSession()` reads the stored pair without a network
   * call, which is what hydration needs — `me()` revalidates on mount.
   */
  hasSession: async () => {
    const { data } = await getSupabaseClient().auth.getSession();
    return data.session !== null;
  },

  /**
   * Local-only clear, and deliberately never throws: it runs on the paths where
   * the caller has already decided to be signed out — a rejected credential, a
   * logout whose network call failed — and throwing there would strand the app
   * holding a credential it has chosen to discard.
   */
  clearSession: async () => {
    try {
      await getSupabaseClient().auth.signOut({ scope: 'local' });
    } catch {
      // Already gone, or storage unavailable. Either way the intent is met.
    }
  },
};
