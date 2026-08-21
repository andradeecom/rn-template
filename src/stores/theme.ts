import { UnistylesRuntime } from 'react-native-unistyles';
import { create } from 'zustand';
import { DEFAULT_THEME, getStoredTheme, setStoredTheme, type AppThemeName } from '@/lib/theme-storage';

type ThemeState = {
  theme: AppThemeName;
  isHydrated: boolean;
  setTheme: (theme: AppThemeName) => Promise<void>;
  toggleTheme: () => Promise<void>;
  hydrate: () => Promise<void>;
};

/**
 * Owns the active theme.
 *
 * `UnistylesRuntime.setTheme()` alone restyles Unistyles components, but React
 * Navigation is a separate consumer that needs its own light/dark theme object.
 * Both read from here, so a single call keeps the app chrome and the screens
 * from disagreeing — see `RootNavigator`.
 *
 * The app defaults to light and only follows an explicit choice; it deliberately
 * does not track the device's colour scheme. Add that later by storing a third
 * `'system'` preference and resolving it against `useColorScheme()`.
 */
export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: DEFAULT_THEME,
  isHydrated: false,

  setTheme: async (theme: AppThemeName) => {
    UnistylesRuntime.setTheme(theme);
    set({ theme });
    // Persist after applying, so a storage failure cannot leave the UI showing
    // a theme the store does not agree with.
    await setStoredTheme(theme);
  },

  toggleTheme: async () => {
    await get().setTheme(get().theme === 'dark' ? 'light' : 'dark');
  },

  hydrate: async () => {
    const theme = (await getStoredTheme()) ?? DEFAULT_THEME;
    UnistylesRuntime.setTheme(theme);
    set({ theme, isHydrated: true });
  },
}));
