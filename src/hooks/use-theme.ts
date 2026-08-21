import { useThemeStore } from '@/stores/theme';

/**
 * Subscribes the caller to the active theme.
 *
 * Unistyles restyles its own components without any subscription, so this is
 * only needed where a component has to branch on the theme name itself — a
 * toggle showing which mode is active, or handing the theme to a non-Unistyles
 * consumer like React Navigation.
 */
export function useTheme() {
  const theme = useThemeStore((s) => s.theme);
  const setTheme = useThemeStore((s) => s.setTheme);
  const toggleTheme = useThemeStore((s) => s.toggleTheme);

  return { theme, setTheme, toggleTheme, isDark: theme === 'dark' };
}
