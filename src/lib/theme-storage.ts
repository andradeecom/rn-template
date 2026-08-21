import { deviceStorage } from './storage';

const THEME_KEY = 'app_theme';

export const APP_THEMES = ['light', 'dark'] as const;
export type AppThemeName = (typeof APP_THEMES)[number];

/** The theme used until a stored preference says otherwise. */
export const DEFAULT_THEME: AppThemeName = 'light';

export function isAppThemeName(value: string): value is AppThemeName {
  return (APP_THEMES as readonly string[]).includes(value);
}

/**
 * A theme preference is not a credential, so device storage is the right home —
 * the same split the locale preference follows.
 */
export async function getStoredTheme(): Promise<AppThemeName | null> {
  const raw = await deviceStorage.get(THEME_KEY);
  return raw && isAppThemeName(raw) ? raw : null;
}

export async function setStoredTheme(theme: AppThemeName): Promise<void> {
  await deviceStorage.set(THEME_KEY, theme);
}
