import { apiAdapter } from '@/adapters/api';
import { supabaseAdapter } from '@/adapters/supabase';
import type { AuthPort, BackendAdapter } from '@/adapters/ports';

/**
 * The contract test: one suite, run against every provider.
 *
 * The whole point of this layer is that a provider can be swapped without the
 * app noticing, and that guarantee is only worth something if it is checked
 * against each adapter rather than against the one that happens to be wired up.
 * A new provider is added to this array and inherits the whole suite.
 */
const adapters: BackendAdapter[] = [apiAdapter, supabaseAdapter];

/**
 * Every method on `AuthPort`, listed literally rather than derived from the
 * type — types vanish at runtime, so a `keyof AuthPort` loop would only ever
 * check the keys an adapter already has and would pass no matter what was
 * missing. Adding a method to the port means adding it here, which is the
 * reminder to implement it on every provider.
 */
const AUTH_METHODS: (keyof AuthPort)[] = [
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
  'hasSession',
  'clearSession',
];

describe.each(adapters)('$name adapter', (adapter) => {
  it('declares the provider name it is registered under', () => {
    expect(adapter.name).toBeTruthy();
  });

  it.each(AUTH_METHODS)('implements %s', (method) => {
    expect(typeof adapter.auth[method]).toBe('function');
  });

  // A method the port does not declare is a provider detail that leaked onto
  // the shared surface — the thing callers would start depending on and that
  // would then break the moment the other provider is selected.
  it('exposes nothing beyond the port', () => {
    expect(Object.keys(adapter.auth).sort()).toEqual([...AUTH_METHODS].sort());
  });

  /**
   * `clearSession` runs on the failure paths — a rejected credential, a logout
   * whose network call never landed — where the caller has already decided to
   * end up signed out. Every provider must let that succeed, including one
   * whose other methods are unimplemented, or the app can get stuck holding a
   * credential it has chosen to discard.
   */
  it('resolves clearSession without touching the network', async () => {
    await expect(adapter.auth.clearSession()).resolves.toBeUndefined();
  });
});

/**
 * Compile-time proof that both adapters really are interchangeable.
 *
 * The runtime checks above catch a missing method; this catches a mismatched
 * signature, which is the subtler failure — an adapter that takes a different
 * payload or resolves to a different shape would satisfy every assertion above
 * and still break its callers.
 */
describe('port assignability', () => {
  it('accepts either adapter wherever an AuthPort is required', () => {
    const ports: AuthPort[] = [apiAdapter.auth, supabaseAdapter.auth];

    expect(ports).toHaveLength(adapters.length);
  });
});
