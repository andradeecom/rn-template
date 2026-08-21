import {
  DEFAULT_PROVIDER,
  getAuthPort,
  getBackendAdapter,
  resetBackendAdapter,
  resolveProviderName,
  setBackendAdapter,
} from '@/adapters/container';
import { apiAdapter } from '@/adapters/api';
import { supabaseAdapter } from '@/adapters/supabase';
import type { AuthPort, BackendAdapter } from '@/adapters/ports';

describe('resolveProviderName', () => {
  afterEach(() => jest.restoreAllMocks());

  it.each(['api', 'supabase'])('accepts the known provider %s', (name) => {
    expect(resolveProviderName(name)).toBe(name);
  });

  // EXPO_PUBLIC_* is inlined at build time, so a typo cannot be corrected on a
  // device that already has the binary. Falling back keeps the app usable and
  // makes the mistake visible in the log, where a hard crash on launch would do
  // neither.
  it('falls back to the default on an unknown value, and warns', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});

    expect(resolveProviderName('firebase')).toBe(DEFAULT_PROVIDER);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('firebase'));
  });

  // An unset variable is the normal case for a fresh checkout, not a mistake,
  // so it must not add noise to every startup.
  it.each([
    ['undefined', undefined],
    ['empty', ''],
  ])('falls back silently when the variable is %s', (_label, value) => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});

    expect(resolveProviderName(value)).toBe(DEFAULT_PROVIDER);
    expect(warn).not.toHaveBeenCalled();
  });

  it('defaults to the REST backend so the template runs unconfigured', () => {
    expect(DEFAULT_PROVIDER).toBe('api');
  });
});

describe('the active adapter', () => {
  afterEach(() => resetBackendAdapter());

  it('resolves the env-configured provider by default', () => {
    expect(getBackendAdapter()).toBe(apiAdapter);
  });

  it('swaps the whole adapter', () => {
    setBackendAdapter(supabaseAdapter);

    expect(getBackendAdapter()).toBe(supabaseAdapter);
    expect(getAuthPort()).toBe(supabaseAdapter.auth);
  });

  it('restores the configured provider on reset', () => {
    setBackendAdapter(supabaseAdapter);
    resetBackendAdapter();

    expect(getBackendAdapter()).toBe(apiAdapter);
  });

  /**
   * The binding has to be late. `getAuthPort` reads the container on every call
   * so a swap reaches code that has already been imported — an eagerly
   * destructured `const { auth } = getBackendAdapter()` at module scope would
   * freeze the first provider and silently ignore every later override, which
   * is precisely the bug this indirection exists to prevent.
   */
  it('reflects a swap in callers that resolved the port earlier', () => {
    const before = getAuthPort();
    setBackendAdapter(supabaseAdapter);

    expect(getAuthPort()).not.toBe(before);
  });

  // The seam tests rely on: a hand-written double, not a real provider.
  it('accepts an arbitrary adapter that satisfies the port', async () => {
    const fake: BackendAdapter = {
      name: 'api',
      auth: { me: jest.fn().mockResolvedValue({ id: 'u1' }) } as unknown as AuthPort,
    };

    setBackendAdapter(fake);

    await expect(getAuthPort().me()).resolves.toEqual({ id: 'u1' });
  });
});

/**
 * The container imports every provider to build its registry, so any
 * module-level side effect in an adapter runs on every launch regardless of
 * which provider is selected.
 *
 * This regressed once: `createClient` throws when the Supabase URL is unset, so
 * constructing it at import crashed the app on startup for anyone using the
 * REST backend without Supabase credentials — the default configuration.
 */
describe('importing providers has no side effects', () => {
  it('builds the registry without Supabase credentials configured', () => {
    expect(process.env.EXPO_PUBLIC_SUPABASE_URL ?? '').toBe('');
    expect(() => jest.requireActual('@/adapters/container')).not.toThrow();
  });

  it('resolves the api provider while Supabase is unconfigured', () => {
    expect(getBackendAdapter()).toBe(apiAdapter);
    expect(getAuthPort()).toBe(apiAdapter.auth);
  });
});
