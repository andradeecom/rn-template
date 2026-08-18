import { create } from 'zustand';
import type { User } from '@/types/auth';
import { getSessionId } from '@/lib/secure-store';
import { getStoredUser } from '@/lib/user-storage';

type AuthState = {
  user: User | null;
  isAuthenticated: boolean;
  isHydrated: boolean;
  setAuth: (user: User) => void;
  clearAuth: () => void;
  hydrate: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isHydrated: false,

  setAuth: (user: User) => {
    set({ user, isAuthenticated: true });
  },

  clearAuth: () => {
    set({ user: null, isAuthenticated: false });
  },

  hydrate: async () => {
    // A stored session id is only a hint that a session *may* still be live —
    // it is opaque, so only the server can confirm it. `useMe` revalidates on
    // mount and the api client clears everything on a 401.
    const [sessionId, user] = await Promise.all([getSessionId(), getStoredUser()]);
    if (sessionId && user) {
      set({ user, isAuthenticated: true, isHydrated: true });
    } else {
      set({ isHydrated: true });
    }
  },
}));
