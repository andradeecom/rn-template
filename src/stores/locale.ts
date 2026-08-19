import { create } from 'zustand';
import { i18n, SUPPORTED_LOCALES, type SupportedLocale } from '@/i18n';
import { getDeviceLocale, getStoredLocale, setStoredLocale } from '@/lib/locale-storage';

type LocaleState = {
  locale: SupportedLocale;
  isHydrated: boolean;
  setLocale: (locale: SupportedLocale) => Promise<void>;
  hydrate: () => Promise<void>;
};

/**
 * Holds the active language in React state.
 *
 * Assigning `i18n.locale` alone changes what `translate()` returns but does not
 * tell React anything, so mounted screens would keep their old strings until
 * something else happened to re-render them. Components read `locale` from this
 * store — even when they do not display it — so a change re-renders the tree.
 */
export const useLocaleStore = create<LocaleState>((set) => ({
  /*
   * Deliberately a constant, not `getDeviceLocale()`.
   *
   * Zustand runs this initializer at import time, and `getLocales()` reaches
   * into expo-localization's native module — which is not registered that
   * early, so calling it here crashes the bundle before React mounts
   * ("property is not writable", then "main has not been registered").
   *
   * `hydrate()` resolves the real language a moment later, and `useHydrate`
   * holds the splash screen until it has, so this value is never rendered.
   */
  locale: SUPPORTED_LOCALES[0],
  isHydrated: false,

  setLocale: async (locale: SupportedLocale) => {
    i18n.locale = locale;
    set({ locale });
    // Persist after applying, so a storage failure cannot leave the UI showing
    // a language the store does not agree with.
    await setStoredLocale(locale);
  },

  hydrate: async () => {
    const stored = await getStoredLocale();
    const locale = stored ?? getDeviceLocale();
    i18n.locale = locale;
    set({ locale, isHydrated: true });
  },
}));
