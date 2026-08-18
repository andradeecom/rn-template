import { useAuthStore } from '@/stores/auth';
import { getSessionId } from '@/lib/secure-store';
import { getStoredUser } from '@/lib/user-storage';
import type { User } from '@/types/auth';

jest.mock('@/lib/secure-store', () => ({ getSessionId: jest.fn() }));
jest.mock('@/lib/user-storage', () => ({ getStoredUser: jest.fn() }));

const mockedSessionId = getSessionId as jest.MockedFunction<typeof getSessionId>;
const mockedUser = getStoredUser as jest.MockedFunction<typeof getStoredUser>;

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
