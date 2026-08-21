import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { deviceStorage, secureStorage } from '@/lib/storage';
import type { StoragePort } from '@/lib/storage';

/**
 * One suite, run against every implementation.
 *
 * The two backends are wildly different — a chunked keystore versus a flat
 * key-value file — so the shared behaviour is worth stating once and holding
 * both to it. A caller picks an instance for its security guarantee, not for
 * its semantics, and any divergence here would make that choice leaky.
 */
const store = new Map<string, string>();

beforeEach(() => {
  store.clear();
  jest.clearAllMocks();

  (SecureStore.getItemAsync as jest.Mock).mockImplementation(async (k: string) => store.get(k) ?? null);
  (SecureStore.setItemAsync as jest.Mock).mockImplementation(async (k: string, v: string) => {
    store.set(k, v);
  });
  (SecureStore.deleteItemAsync as jest.Mock).mockImplementation(async (k: string) => void store.delete(k));

  return AsyncStorage.clear();
});

const implementations: [string, StoragePort][] = [
  ['secureStorage', secureStorage],
  ['deviceStorage', deviceStorage],
];

describe.each(implementations)('%s', (_name, storage) => {
  it('returns null for a key that was never written', async () => {
    await expect(storage.get('absent')).resolves.toBeNull();
  });

  it('round-trips a value', async () => {
    await storage.set('k', 'value');

    await expect(storage.get('k')).resolves.toBe('value');
  });

  it('overwrites rather than appending', async () => {
    await storage.set('k', 'first');
    await storage.set('k', 'second');

    await expect(storage.get('k')).resolves.toBe('second');
  });

  it('removes a value', async () => {
    await storage.set('k', 'value');
    await storage.remove('k');

    await expect(storage.get('k')).resolves.toBeNull();
  });

  // Removing something absent is a no-op, not an error: callers clear on
  // logout paths without first checking what is there.
  it('tolerates removing a key that does not exist', async () => {
    await expect(storage.remove('absent')).resolves.toBeUndefined();
  });

  it('keeps keys independent', async () => {
    await storage.set('a', '1');
    await storage.set('b', '2');
    await storage.remove('a');

    await expect(storage.get('b')).resolves.toBe('2');
  });
});

/**
 * `secureStorage` only.
 *
 * Its chunk header makes "written but empty" and "never written" genuinely
 * distinguishable, and the distinction matters there because the Supabase SDK
 * writes `''` to mean "no session" — reading that back as null would look like
 * corruption. AsyncStorage's jest mock collapses the two, so asserting it for
 * `deviceStorage` would test the mock rather than the code.
 */
describe('secureStorage empty values', () => {
  it('round-trips an empty string as a value, not as absence', async () => {
    await secureStorage.set('k', '');

    await expect(secureStorage.get('k')).resolves.toBe('');
  });

  it('still reports a never-written key as absent', async () => {
    await expect(secureStorage.get('never')).resolves.toBeNull();
  });
});
