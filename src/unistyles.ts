import { StyleSheet } from 'react-native-unistyles';

// --- Shared tokens (theme-independent) ---

const font = {
  family: 'Inter',
  sizes: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
    '5xl': 48,
  },
  lineHeights: {
    xs: 16,
    sm: 20,
    base: 24,
    lg: 28,
    xl: 28,
    '2xl': 32,
    '3xl': 36,
    '4xl': 40,
    '5xl': 48,
  },
  weights: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
  letterSpacing: {
    tighter: -0.8,
    tight: -0.4,
    normal: 0,
    wide: 0.4,
    wider: 0.8,
  },
} as const;

const spacing = {
  0: 0,
  0.5: 2,
  1: 4,
  1.5: 6,
  2: 8,
  2.5: 10,
  3: 12,
  3.5: 14,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  9: 36,
  10: 40,
  12: 48,
  14: 56,
  16: 64,
  20: 80,
  24: 96,
} as const;

const radius = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 24,
  full: 9999,
} as const;

const zIndex = {
  hide: -1,
  base: 0,
  dropdown: 10,
  sticky: 20,
  overlay: 30,
  modal: 40,
  toast: 50,
} as const;

const opacity = {
  0: 0,
  5: 0.05,
  10: 0.1,
  20: 0.2,
  40: 0.4,
  60: 0.6,
  80: 0.8,
  100: 1,
} as const;

const gap = (v: number) => v * 8;

// --- Colors ---

const lightTheme = {
  colors: {
    background: '#ffffff',
    foreground: '#0a0a0a',

    card: '#ffffff',
    cardForeground: '#0a0a0a',

    popover: '#ffffff',
    popoverForeground: '#0a0a0a',

    primary: '#171717',
    primaryForeground: '#fafafa',

    secondary: '#f5f5f5',
    secondaryForeground: '#171717',

    muted: '#f5f5f5',
    mutedForeground: '#737373',

    accent: '#f5f5f5',
    accentForeground: '#171717',

    destructive: '#ef4444',
    destructiveForeground: '#fafafa',

    success: '#22c55e',
    successForeground: '#fafafa',

    warning: '#f59e0b',
    warningForeground: '#fafafa',

    border: '#e5e5e5',
    input: '#e5e5e5',
    ring: '#0a0a0a',

    gray: {
      50: '#fafafa',
      100: '#f5f5f5',
      200: '#e5e5e5',
      300: '#d4d4d4',
      400: '#a3a3a3',
      500: '#737373',
      600: '#525252',
      700: '#404040',
      800: '#262626',
      900: '#171717',
      950: '#0a0a0a',
    },
  },
  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 6,
    },
    xl: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.1,
      shadowRadius: 16,
      elevation: 10,
    },
  },
  font,
  spacing,
  radius,
  zIndex,
  opacity,
  gap,
} as const;

const darkTheme = {
  colors: {
    background: '#0a0a0a',
    foreground: '#fafafa',

    card: '#0a0a0a',
    cardForeground: '#fafafa',

    popover: '#0a0a0a',
    popoverForeground: '#fafafa',

    primary: '#fafafa',
    primaryForeground: '#171717',

    secondary: '#262626',
    secondaryForeground: '#fafafa',

    muted: '#262626',
    mutedForeground: '#a3a3a3',

    accent: '#262626',
    accentForeground: '#fafafa',

    destructive: '#dc2626',
    destructiveForeground: '#fafafa',

    success: '#16a34a',
    successForeground: '#fafafa',

    warning: '#d97706',
    warningForeground: '#fafafa',

    border: '#262626',
    input: '#262626',
    ring: '#d4d4d4',

    gray: {
      50: '#0a0a0a',
      100: '#171717',
      200: '#262626',
      300: '#404040',
      400: '#525252',
      500: '#737373',
      600: '#a3a3a3',
      700: '#d4d4d4',
      800: '#e5e5e5',
      900: '#f5f5f5',
      950: '#fafafa',
    },
  },
  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.15,
      shadowRadius: 2,
      elevation: 1,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 3,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 8,
      elevation: 6,
    },
    xl: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.3,
      shadowRadius: 16,
      elevation: 10,
    },
  },
  font,
  spacing,
  radius,
  zIndex,
  opacity,
  gap,
} as const;

// --- App config ---

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
    initialTheme: 'light',
  },
  breakpoints,
  themes: appThemes,
});
