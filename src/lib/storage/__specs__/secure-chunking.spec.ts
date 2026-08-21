import * as SecureStore from 'expo-secure-store';
import { secureStorage } from '@/lib/storage';

const store = new Map<string, string>();
const getItem = SecureStore.getItemAsync as jest.MockedFunction<typeof SecureStore.getItemAsync>;
const setItem = SecureStore.setItemAsync as jest.MockedFunction<typeof SecureStore.setItemAsync>;
const deleteItem = SecureStore.deleteItemAsync as jest.MockedFunction<typeof SecureStore.deleteItemAsync>;

beforeEach(() => {
  store.clear();
  jest.clearAllMocks();
  getItem.mockImplementation(async (k) => store.get(k) ?? null);
  setItem.mockImplementation(async (k, v) => {
    if (v.length > 2048) throw new Error('Value too large for SecureStore');
    store.set(k, v);
  });
  deleteItem.mockImplementation(async (k) => void store.delete(k));
});

/** base64url, without depending on Node's Buffer — this runs in a RN-typed project. */
const b64url = (value: string) => btoa(value).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

const fromB64url = (value: string) =>
  atob(
    value
      .replace(/-/g, '+')
      .replace(/_/g, '/')
      .padEnd(Math.ceil(value.length / 4) * 4, '=')
  );

// A realistic Supabase session: JWTs with dots, base64 padding, nested JSON.
function makeJwt(claimBytes: number): string {
  const header = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = b64url(JSON.stringify({ sub: 'a1b2c3', role: 'authenticated', bloat: 'q'.repeat(claimBytes) }));
  return `${header}.${payload}.sIgNaTuRe-With_Special+Chars/==`;
}

const session = JSON.stringify({
  access_token: makeJwt(3000),
  refresh_token: 'v1.MnQ4x-_9aB',
  expires_at: 1893456000,
  token_type: 'bearer',
  user: { id: 'a1b2c3', email: 'ada@example.com', user_metadata: { firstName: 'Ada', bio: 'é→漢字🔐' } },
});

describe('a real Supabase session survives chunking', () => {
  it('round-trips byte-for-byte', async () => {
    await secureStorage.set('sb-auth-token', session);
    const restored = await secureStorage.get('sb-auth-token');

    expect(restored).toBe(session);
  });

  it('is still valid JSON with the credential intact', async () => {
    await secureStorage.set('sb-auth-token', session);
    const restored = JSON.parse((await secureStorage.get('sb-auth-token'))!);

    expect(restored.access_token).toBe(JSON.parse(session).access_token);
    expect(restored.refresh_token).toBe('v1.MnQ4x-_9aB');
    expect(restored.user.user_metadata.bio).toBe('é→漢字🔐');
  });

  it('the reassembled JWT still has exactly 3 segments and decodes', async () => {
    await secureStorage.set('sb-auth-token', session);
    const restored = JSON.parse((await secureStorage.get('sb-auth-token'))!);
    const parts = restored.access_token.split('.');

    expect(parts).toHaveLength(3);
    const claims = JSON.parse(fromB64url(parts[1]));
    expect(claims.sub).toBe('a1b2c3');
    expect(claims.role).toBe('authenticated');
  });

  it('actually chunked it — this is not a trivially-small value', async () => {
    await secureStorage.set('sb-auth-token', session);
    const chunks = [...store.keys()].filter((k) => k.startsWith('sb-auth-token.'));

    expect(session.length).toBeGreaterThan(2048);
    expect(chunks.length).toBeGreaterThan(1);
  });

  // The failure you were worried about: a slice landing mid-token.
  it('splits mid-JWT and still rejoins correctly', async () => {
    await secureStorage.set('sb-auth-token', session);
    const stored = [...store.entries()]
      .filter(([k]) => k.startsWith('sb-auth-token.'))
      .sort(([a], [b]) => Number(a.split('.').pop()) - Number(b.split('.').pop()))
      .map(([, v]) => v);

    // Prove no chunk boundary respects the JWT structure — cuts are blind.
    expect(stored[0].endsWith('.')).toBe(false);
    expect(stored.join('')).toBe(session);
  });
});
