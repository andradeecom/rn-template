import { ProviderNotImplementedError, supabaseAuthAdapter } from '@/adapters/supabase';

/**
 * The stub's job is to fail well.
 *
 * Selecting an unimplemented provider is a configuration mistake, and it has to
 * read as one — a rejection that names the method and the way out, rather than
 * an undefined-is-not-a-function surfacing from inside a React Query mutation
 * where it looks like a network fault.
 */
describe('supabase auth stub', () => {
  it('rejects with a named error that identifies the missing method', async () => {
    await expect(supabaseAuthAdapter.login({ email: 'a@b.com', password: 'pw' })).rejects.toThrow(
      ProviderNotImplementedError
    );

    await expect(supabaseAuthAdapter.login({ email: 'a@b.com', password: 'pw' })).rejects.toThrow(/login/);
  });

  it('points at the working provider in the message', async () => {
    await expect(supabaseAuthAdapter.me()).rejects.toThrow(/EXPO_PUBLIC_API_PROVIDER/);
  });

  it('rejects rather than returning undefined, so callers see a failure', async () => {
    await expect(supabaseAuthAdapter.logout()).rejects.toBeInstanceOf(Error);
  });

  /**
   * The one deliberate exception. `clearSession` runs where the caller has
   * already decided to be signed out — a 401, or a logout whose network call
   * failed — so throwing would strand the app holding a discarded credential.
   */
  it('still clears the local session', async () => {
    await expect(supabaseAuthAdapter.clearSession()).resolves.toBeUndefined();
  });
});
