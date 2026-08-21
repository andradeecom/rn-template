import { StyleSheet } from 'react-native-unistyles';
import { font } from './font';
import { spacing, gap } from './spacing';
import { radius } from './radius';
import { zIndex } from './z-index';
import { opacity } from './opacity';
import { colors } from './colors';
import { shadows } from './shadows';

// --- App config ---

const lightTheme = {
  colors: colors.light,
  shadows: shadows.light,
  font,
  spacing,
  radius,
  zIndex,
  opacity,
  gap,
} as const;

const darkTheme = {
  colors: colors.dark,
  shadows: shadows.dark,
  font,
  spacing,
  radius,
  zIndex,
  opacity,
  gap,
} as const;

const appThemes = {
  light: lightTheme,
  dark: darkTheme,
};

const breakpoints = {
  xs: 0,
  sm: 300,
  md: 500,
  lg: 800,
  xl: 1200,
};

type AppBreakpoints = typeof breakpoints;
type AppThemes = typeof appThemes;

declare module 'react-native-unistyles' {
  export interface UnistylesThemes extends AppThemes {}
  export interface UnistylesBreakpoints extends AppBreakpoints {}
}

StyleSheet.configure({
  settings: {
    /*
     * Light is the default, and stays the default: `adaptiveThemes` is
     * deliberately not set (Unistyles treats the two as mutually exclusive), so
     * the app does not follow the device colour scheme.
     *
     * This is only the value used before hydration. `useThemeStore.hydrate()`
     * applies a stored preference over it on launch, and `setTheme()` switches
     * it at runtime — so dark mode works, it just is not automatic.
     */
    initialTheme: 'light',
  },
  breakpoints,
  themes: appThemes,
});
