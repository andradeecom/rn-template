import * as SecureStore from 'expo-secure-store';
import { secureStorage } from '@/adapters/supabase/client';

const store = new Map<string, string>();

const getItem = SecureStore.getItemAsync as jest.MockedFunction<typeof SecureStore.getItemAsync>;
const setItem = SecureStore.setItemAsync as jest.MockedFunction<typeof SecureStore.setItemAsync>;
const deleteItem = SecureStore.deleteItemAsync as jest.MockedFunction<typeof SecureStore.deleteItemAsync>;

/**
 * SecureStore rejects values over 2048 bytes, and a Supabase session with
 * custom claims can exceed that. The failure is silent and badly delayed — the
 * write throws, the session is never persisted, and the user appears to be
 * logged out at random much later — so the chunking is pinned here.
 */
beforeEach(() => {
  store.clear();
  jest.clearAllMocks();

  getItem.mockImplementation(async (key) => store.get(key) ?? null);
  setItem.mockImplementation(async (key, value) => {
    // Mirror the real limit so an unchunked write would fail this suite.
    if (value.length > 2048) throw new Error('Value too large for SecureStore');
    store.set(key, value);
  });
  deleteItem.mockImplementation(async (key) => void store.delete(key));
});

describe('secureStorage round-trip', () => {
  it.each([
    ['a short value', 'small-session'],
    ['a value past the 2KB limit', 'x'.repeat(5000)],
    ['an empty value', ''],
  ])('round-trips %s', async (_label, value) => {
    await secureStorage.setItem('sb-session', value);

    await expect(secureStorage.getItem('sb-session')).resolves.toBe(value);
  });

  it('never writes a single item above the limit', async () => {
    await secureStorage.setItem('sb-session', 'x'.repeat(9000));

    for (const [, written] of setItem.mock.calls) {
      expect(written.length).toBeLessThanOrEqual(2048);
    }
  });

  it('returns null for a key that was never written', async () => {
    await expect(secureStorage.getItem('missing')).resolves.toBeNull();
  });
});

describe('secureStorage cleanup', () => {
  /**
   * Shrinking a value must drop the surplus chunks. Leaving them behind would
   * let a later read splice the tail of the old session onto the new one and
   * hand the SDK an unparseable credential.
   */
  it('drops surplus chunks when the value shrinks', async () => {
    await secureStorage.setItem('sb-session', 'x'.repeat(6000));
    await secureStorage.setItem('sb-session', 'short');

    await expect(secureStorage.getItem('sb-session')).resolves.toBe('short');
    expect([...store.keys()].filter((k) => k.startsWith('sb-session.'))).toHaveLength(1);
  });

  it('removes every chunk on removeItem', async () => {
    await secureStorage.setItem('sb-session', 'x'.repeat(6000));
    await secureStorage.removeItem('sb-session');

    expect([...store.keys()]).toHaveLength(0);
    await expect(secureStorage.getItem('sb-session')).resolves.toBeNull();
  });

  /**
   * A torn write — process killed mid-save, or a chunk evicted — must read as
   * absent rather than as a truncated session. Re-authenticating is recoverable;
   * handing the SDK half a credential is not.
   */
  it('treats a missing chunk as no value at all', async () => {
    await secureStorage.setItem('sb-session', 'x'.repeat(6000));
    store.delete('sb-session.1');

    await expect(secureStorage.getItem('sb-session')).resolves.toBeNull();
  });

  it('treats a corrupted header as no value at all', async () => {
    store.set('sb-session', 'not-a-number');

    await expect(secureStorage.getItem('sb-session')).resolves.toBeNull();
  });
});
