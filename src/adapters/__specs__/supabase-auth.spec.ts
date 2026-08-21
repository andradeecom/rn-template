import { supabaseAuthAdapter } from '@/adapters/supabase';
import { getSupabaseClient } from '@/adapters/supabase/client';

const mockAuth = {
  signInWithPassword: jest.fn(),
  signUp: jest.fn(),
  signOut: jest.fn(),
  verifyOtp: jest.fn(),
  resend: jest.fn(),
  updateUser: jest.fn(),
  getUser: jest.fn(),
  getSession: jest.fn(),
  signInWithIdToken: jest.fn(),
  resetPasswordForEmail: jest.fn(),
};

jest.mock('@/adapters/supabase/client', () => ({
  getSupabaseClient: jest.fn(() => ({ auth: mockAuth })),
}));

const auth = mockAuth as unknown as Record<string, jest.Mock>;
void getSupabaseClient;

const supabaseUser = {
  id: 'u1',
  email: 'a@b.com',
  email_confirmed_at: '2024-01-01T00:00:00Z',
  user_metadata: { firstName: 'Ada', lastName: 'Lovelace', role: 'admin' },
};

const authError = (message: string, status = 400) => ({
  name: 'AuthApiError',
  message,
  status,
});

beforeEach(() => jest.clearAllMocks());

describe('login', () => {
  it('maps the Supabase user onto the app User', async () => {
    auth.signInWithPassword.mockResolvedValue({ data: { user: supabaseUser, session: {} }, error: null });

    await expect(supabaseAuthAdapter.login({ email: 'a@b.com', password: 'pw' })).resolves.toEqual({
      user: {
        id: 'u1',
        email: 'a@b.com',
        firstName: 'Ada',
        lastName: 'Lovelace',
        role: 'admin',
        profileImageUrl: null,
        mustChangePassword: false,
        emailVerifiedAt: '2024-01-01T00:00:00Z',
      },
    });
  });

  // Screens read `error.response.status`, an axios shape. Supabase's flat
  // `status` has to be reshaped in the adapter or every call site would need to
  // branch on the active provider.
  it('normalizes an AuthError into the shape screens already handle', async () => {
    auth.signInWithPassword.mockResolvedValue({ data: {}, error: authError('Invalid login credentials', 400) });

    await expect(supabaseAuthAdapter.login({ email: 'a@b.com', password: 'bad' })).rejects.toMatchObject({
      message: 'Invalid login credentials',
      response: { status: 400, data: { message: 'Invalid login credentials' } },
    });
  });
});

/**
 * The port promises registration does not sign the user in. Supabase returns a
 * live session when email confirmation is disabled, so leaving it in place
 * would make the two providers behave differently for the same call — the
 * subtlest kind of adapter bug.
 */
describe('register', () => {
  it('discards a session when Supabase returns one', async () => {
    auth.signUp.mockResolvedValue({ data: { user: supabaseUser, session: { access_token: 'x' } }, error: null });
    auth.signOut.mockResolvedValue({ error: null });

    await supabaseAuthAdapter.register({
      email: 'a@b.com',
      password: 'pw',
      firstName: 'Ada',
      lastName: 'Lovelace',
    });

    expect(auth.signOut).toHaveBeenCalledWith({ scope: 'local' });
  });

  it('does not sign out when confirmation is pending', async () => {
    auth.signUp.mockResolvedValue({ data: { user: supabaseUser, session: null }, error: null });

    await supabaseAuthAdapter.register({
      email: 'a@b.com',
      password: 'pw',
      firstName: 'Ada',
      lastName: 'Lovelace',
    });

    expect(auth.signOut).not.toHaveBeenCalled();
  });

  it('passes the names through as user_metadata', async () => {
    auth.signUp.mockResolvedValue({ data: { user: supabaseUser, session: null }, error: null });

    await supabaseAuthAdapter.register({
      email: 'a@b.com',
      password: 'pw',
      firstName: 'Ada',
      lastName: 'Lovelace',
    });

    expect(auth.signUp).toHaveBeenCalledWith(
      expect.objectContaining({ options: { data: { firstName: 'Ada', lastName: 'Lovelace' } } })
    );
  });
});

/**
 * Supabase recovery is session-based: the emailed token must be exchanged for a
 * session before the password can be set. Getting the order wrong fails for
 * every user, so it is pinned.
 */
describe('resetPassword', () => {
  it('exchanges the token before updating, then drops the session', async () => {
    const calls: string[] = [];
    auth.verifyOtp.mockImplementation(() => {
      calls.push('verifyOtp');
      return Promise.resolve({ data: { user: supabaseUser, session: {} }, error: null });
    });
    auth.updateUser.mockImplementation(() => {
      calls.push('updateUser');
      return Promise.resolve({ data: { user: supabaseUser }, error: null });
    });
    auth.signOut.mockImplementation(() => {
      calls.push('signOut');
      return Promise.resolve({ error: null });
    });

    await supabaseAuthAdapter.resetPassword({ token: 'tok', newPassword: 'new-pw', confirmPassword: 'new-pw' });

    expect(calls).toEqual(['verifyOtp', 'updateUser', 'signOut']);
    expect(auth.verifyOtp).toHaveBeenCalledWith({ token_hash: 'tok', type: 'recovery' });
  });

  it('does not update the password when the token is rejected', async () => {
    auth.verifyOtp.mockResolvedValue({ data: {}, error: authError('Token has expired', 401) });

    await expect(
      supabaseAuthAdapter.resetPassword({ token: 'stale', newPassword: 'new-pw', confirmPassword: 'new-pw' })
    ).rejects.toMatchObject({ response: { status: 401 } });

    expect(auth.updateUser).not.toHaveBeenCalled();
  });
});

/**
 * Supabase does not check the current password on `updateUser`. Without the
 * explicit re-authentication below, anyone holding an unlocked device could
 * change the password without knowing the old one — which the REST backend
 * does not permit.
 */
describe('changePassword', () => {
  it('re-authenticates before changing the password', async () => {
    auth.getUser.mockResolvedValue({ data: { user: supabaseUser }, error: null });
    auth.signInWithPassword.mockResolvedValue({ data: { user: supabaseUser, session: {} }, error: null });
    auth.updateUser.mockResolvedValue({ data: { user: supabaseUser }, error: null });

    await supabaseAuthAdapter.changePassword({
      currentPassword: 'old-pw',
      newPassword: 'new-pw',
      confirmPassword: 'new-pw',
    });

    expect(auth.signInWithPassword).toHaveBeenCalledWith({ email: 'a@b.com', password: 'old-pw' });
    expect(auth.updateUser).toHaveBeenCalled();
  });

  it('refuses when the current password is wrong', async () => {
    auth.getUser.mockResolvedValue({ data: { user: supabaseUser }, error: null });
    auth.signInWithPassword.mockResolvedValue({ data: {}, error: authError('Invalid login credentials', 400) });

    await expect(
      supabaseAuthAdapter.changePassword({
        currentPassword: 'wrong',
        newPassword: 'new-pw',
        confirmPassword: 'new-pw',
      })
    ).rejects.toMatchObject({ response: { status: 400 } });

    expect(auth.updateUser).not.toHaveBeenCalled();
  });

  // Admin-created accounts on a temporary password skip the check, mirroring
  // the backend rule the change-password schema already encodes.
  it('skips re-authentication when no current password is required', async () => {
    auth.updateUser.mockResolvedValue({ data: { user: supabaseUser }, error: null });

    await supabaseAuthAdapter.changePassword({ newPassword: 'new-pw', confirmPassword: 'new-pw' });

    expect(auth.signInWithPassword).not.toHaveBeenCalled();
    expect(auth.updateUser).toHaveBeenCalledWith({ password: 'new-pw', data: { mustChangePassword: false } });
  });
});

describe('session lifecycle', () => {
  it('logoutAll revokes every refresh token', async () => {
    auth.signOut.mockResolvedValue({ error: null });

    await supabaseAuthAdapter.logoutAll();

    expect(auth.signOut).toHaveBeenCalledWith({ scope: 'global' });
  });

  it('logout only ends this device', async () => {
    auth.signOut.mockResolvedValue({ error: null });

    await supabaseAuthAdapter.logout();

    expect(auth.signOut).toHaveBeenCalledWith({ scope: 'local' });
  });

  it.each([
    ['a stored session', { access_token: 'x' }, true],
    ['no session', null, false],
  ])('hasSession reports %s', async (_label, session, expected) => {
    auth.getSession.mockResolvedValue({ data: { session }, error: null });

    await expect(supabaseAuthAdapter.hasSession()).resolves.toBe(expected);
  });

  // clearSession runs where the caller has already decided to be signed out, so
  // a failure must not propagate and strand a discarded credential.
  it('clearSession swallows failures', async () => {
    auth.signOut.mockRejectedValue(new Error('storage unavailable'));

    await expect(supabaseAuthAdapter.clearSession()).resolves.toBeUndefined();
  });
});

describe('me', () => {
  // getSession() would return the locally cached copy and happily report a
  // revoked session as live; getUser() revalidates against the server.
  it('revalidates against the server rather than reading the cache', async () => {
    auth.getUser.mockResolvedValue({ data: { user: supabaseUser }, error: null });

    await supabaseAuthAdapter.me();

    expect(auth.getUser).toHaveBeenCalled();
    expect(auth.getSession).not.toHaveBeenCalled();
  });
});

describe('verifyEmail', () => {
  it('sends the token as a token_hash', async () => {
    auth.verifyOtp.mockResolvedValue({ data: { user: supabaseUser, session: {} }, error: null });

    await supabaseAuthAdapter.verifyEmail({ token: 'hash' });

    expect(auth.verifyOtp).toHaveBeenCalledWith({ token_hash: 'hash', type: 'email' });
  });
});

/**
 * Both message-only flows answer identically whether or not the address exists.
 * Leaking that distinction would turn either endpoint into an
 * account-enumeration oracle.
 */
describe('account enumeration', () => {
  it('forgotPassword does not reveal whether the email is registered', async () => {
    auth.resetPasswordForEmail.mockResolvedValue({ data: {}, error: null });

    const found = await supabaseAuthAdapter.forgotPassword({ email: 'known@b.com' });
    const missing = await supabaseAuthAdapter.forgotPassword({ email: 'unknown@b.com' });

    expect(found).toEqual(missing);
  });

  it('resendVerification does not reveal it either', async () => {
    auth.resend.mockResolvedValue({ data: {}, error: null });

    const found = await supabaseAuthAdapter.resendVerification({ email: 'known@b.com' });
    const missing = await supabaseAuthAdapter.resendVerification({ email: 'unknown@b.com' });

    expect(found).toEqual(missing);
  });
});
