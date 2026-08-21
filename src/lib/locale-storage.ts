import { getLocales } from 'expo-localization';
import { SUPPORTED_LOCALES, isSupportedLocale, type SupportedLocale } from '@/i18n';
import { deviceStorage } from './storage';

const LOCALE_KEY = 'app_locale';

/**
 * A language preference is not a credential, so device storage is the right
 * home — unlike the session id, which belongs in the keystore.
 */
export async function getStoredLocale(): Promise<SupportedLocale | null> {
  const raw = await deviceStorage.get(LOCALE_KEY);
  return raw && isSupportedLocale(raw) ? raw : null;
}

export async function setStoredLocale(locale: SupportedLocale): Promise<void> {
  await deviceStorage.set(LOCALE_KEY, locale);
}

/**
 * The device's language, narrowed to one this app ships.
 *
 * `getLocales()` returns full tags like `pt-BR`, so the region is dropped
 * before matching — otherwise a Brazilian device would fall through to English
 * despite `pt` being available.
 */
export function getDeviceLocale(): SupportedLocale {
  for (const tag of getLocales()) {
    const base = tag.languageCode ?? tag.languageTag?.split('-')[0];
    if (base && isSupportedLocale(base)) return base;
  }

  return SUPPORTED_LOCALES[0];
}
