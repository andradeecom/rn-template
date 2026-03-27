import { create } from 'zustand';
import type { User } from '@/types/auth';
import { getAccessToken } from '@/lib/secure-store';
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
    const [token, user] = await Promise.all([getAccessToken(), getStoredUser()]);
    if (token && user) {
      set({ user, isAuthenticated: true, isHydrated: true });
    } else {
      set({ isHydrated: true });
    }
  },
}));
