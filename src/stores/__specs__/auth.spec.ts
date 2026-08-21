import { useAuthStore } from '@/stores/auth';
import { getAuthPort } from '@/adapters';
import { getStoredUser } from '@/lib/user-storage';
import type { User } from '@/types/auth';

jest.mock('@/lib/user-storage', () => ({ getStoredUser: jest.fn() }));
jest.mock('@/adapters', () => ({ getAuthPort: jest.fn() }));

const mockedUser = getStoredUser as jest.MockedFunction<typeof getStoredUser>;
const hasSession = jest.fn();

(getAuthPort as jest.Mock).mockReturnValue({ hasSession });

/** Mirrors the old `getSessionId` double, now expressed through the port. */
const mockedSessionId = { mockResolvedValue: (v: string | null) => hasSession.mockResolvedValue(v !== null) };

const user = { id: 'u1', email: 'a@b.com', firstName: 'A', lastName: 'B' } as User;

/**
 * Hydration decides what the app believes on launch, before the network is
 * consulted. It is deliberately optimistic — a stored id only means a session
 * *may* still be live, since the id is opaque and only the server can confirm
 * it — but it must never claim authentication without both halves present.
 */
describe('useAuthStore.hydrate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuthStore.setState({ user: null, isAuthenticated: false, isHydrated: false });
  });

  it('restores the session when both the id and the user are stored', async () => {
    mockedSessionId.mockResolvedValue('stored-id');
    mockedUser.mockResolvedValue(user);

    await useAuthStore.getState().hydrate();

    expect(useAuthStore.getState()).toMatchObject({
      user,
      isAuthenticated: true,
      isHydrated: true,
    });
  });

  // A half-present state is not a session. Trusting either half alone would
  // render the app as signed-in with nothing to authenticate the next request.
  it.each([
    ['no session id', null, user],
    ['no stored user', 'stored-id', null],
    ['neither', null, null],
  ])('stays unauthenticated with %s', async (_label, sessionId, storedUser) => {
    mockedSessionId.mockResolvedValue(sessionId);
    mockedUser.mockResolvedValue(storedUser);

    await useAuthStore.getState().hydrate();

    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(useAuthStore.getState().user).toBeNull();
  });

  // The splash screen waits on isHydrated, so leaving it false on the empty
  // path would hang the app on launch for a signed-out user.
  it('marks hydration complete even when there is no session', async () => {
    mockedSessionId.mockResolvedValue(null);
    mockedUser.mockResolvedValue(null);

    await useAuthStore.getState().hydrate();

    expect(useAuthStore.getState().isHydrated).toBe(true);
  });
});

describe('useAuthStore transitions', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null, isAuthenticated: false, isHydrated: false });
  });

  it('setAuth marks the user authenticated', () => {
    useAuthStore.getState().setAuth(user);

    expect(useAuthStore.getState()).toMatchObject({ user, isAuthenticated: true });
  });

  it('clearAuth drops the user entirely rather than only flipping the flag', () => {
    useAuthStore.getState().setAuth(user);
    useAuthStore.getState().clearAuth();

    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });
});

/**
 * Hydration must ask the *active provider* whether a credential exists, never
 * read one provider's storage directly.
 *
 * This regressed once already: the store called `getSessionId()` from
 * `secure-store`, which is the REST provider's opaque id. Under any provider
 * that stores something else — Supabase's JWT pair — that returns null and the
 * app hydrates as signed-out on every launch despite a valid session, looking
 * like a provider bug rather than a layering one.
 */
describe('useAuthStore.hydrate provider independence', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getAuthPort as jest.Mock).mockReturnValue({ hasSession });
    useAuthStore.setState({ user: null, isAuthenticated: false, isHydrated: false });
  });

  it('asks the port rather than reading a session id directly', async () => {
    hasSession.mockResolvedValue(true);
    mockedUser.mockResolvedValue(user);

    await useAuthStore.getState().hydrate();

    expect(hasSession).toHaveBeenCalled();
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
  });

  it('restores a session for a provider that stores no session id', async () => {
    // A Supabase-shaped provider: no opaque id anywhere, but a live credential.
    hasSession.mockResolvedValue(true);
    mockedUser.mockResolvedValue(user);

    await useAuthStore.getState().hydrate();

    expect(useAuthStore.getState()).toMatchObject({ user, isAuthenticated: true, isHydrated: true });
  });
});
