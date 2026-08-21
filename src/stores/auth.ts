import { create } from 'zustand';
import type { User } from '@/types/auth';
import { getAuthPort } from '@/adapters';
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
    // A stored credential is only a hint that a session *may* still be live —
    // only the server can confirm it. `useMe` revalidates on mount and the
    // adapter clears everything on a 401.
    //
    // Asked through the port rather than by reading a session id directly: the
    // credential's shape is the active provider's business, and hardcoding one
    // provider's model here hydrates every other provider as signed-out.
    const [hasSession, user] = await Promise.all([getAuthPort().hasSession(), getStoredUser()]);
    if (hasSession && user) {
      set({ user, isAuthenticated: true, isHydrated: true });
    } else {
      set({ isHydrated: true });
    }
  },
}));
