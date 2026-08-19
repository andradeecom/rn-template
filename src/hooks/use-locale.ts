import { useCallback } from 'react';
import type { TranslateOptions } from 'i18n-js';
import { i18n, type TxKeyPath } from '@/i18n';
import { useLocaleStore } from '@/stores/locale';

/**
 * Subscribes the caller to the active language.
 *
 * Reading `locale` here is what re-renders a screen when the language changes —
 * `translate()` is a plain function call, so without a subscription its output
 * would go stale until something else re-rendered.
 */
export function useLocale() {
  const locale = useLocaleStore((s) => s.locale);
  const setLocale = useLocaleStore((s) => s.setLocale);

  return { locale, setLocale };
}

/**
 * Returns a `t` bound to the active language.
 *
 * Prefer this over the plain `translate()` for anything computed during
 * render: the subscription re-renders the component on language change, and
 * because `t` derives from reactive state, React Compiler recomputes its
 * results instead of serving a stale memoized string. `translate()` remains
 * correct inside event handlers, which run after the change.
 */
export function useTranslation() {
  const locale = useLocaleStore((s) => s.locale);

  const t = useCallback(
    (key: TxKeyPath, options?: TranslateOptions): string => i18n.t(key, { ...options, locale }),
    [locale]
  );

  return { t, locale };
}
