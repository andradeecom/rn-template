import { getAuthPort, resetBackendAdapter, setBackendAdapter } from '@/adapters';
import { supabaseAdapter } from '@/adapters/supabase';
import { authApi } from '@/services/auth';

jest.mock('@/services/auth', () => ({
  authApi: { login: jest.fn().mockResolvedValue({ user: { id: 'u1' } }) },
}));

/**
 * End-to-end check that the indirection actually pays off: the same call site
 * reaches a different backend purely because the container was swapped.
 *
 * `use-auth.ts` cannot be exercised directly here without a React renderer, so
 * this asserts the mechanism it depends on — `getAuthPort()` resolved at call
 * time — which is the part that would break if the binding were ever hoisted.
 */
describe('provider swapping', () => {
  afterEach(() => resetBackendAdapter());

  it('routes a login through whichever provider is installed', async () => {
    await expect(getAuthPort().login({ email: 'a@b.com', password: 'pw' })).resolves.toEqual({ user: { id: 'u1' } });
    expect(authApi.login).toHaveBeenCalled();

    setBackendAdapter(supabaseAdapter);

    // Same call site, different backend — and the REST service is not consulted.
    (authApi.login as jest.Mock).mockClear();
    await expect(getAuthPort().login({ email: 'a@b.com', password: 'pw' })).rejects.toThrow(/supabase/i);
    expect(authApi.login).not.toHaveBeenCalled();
  });
});
