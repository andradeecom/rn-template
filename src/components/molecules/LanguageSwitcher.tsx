import { View } from 'react-native';
import { Host, Picker } from '@expo/ui';
import { StyleSheet } from 'react-native-unistyles';
import { Text } from '@/components/atoms';
import { SUPPORTED_LOCALES, type SupportedLocale } from '@/i18n';
import { useTranslation } from '@/hooks/use-locale';

/**
 * Language names are deliberately NOT translated — each is written in its own
 * language, so a user who has landed in a language they cannot read can still
 * find their own.
 */
const LANGUAGE_NAMES: Record<SupportedLocale, string> = {
  en: 'English',
  es: 'Español',
  pt: 'Português',
};

type LanguageSwitcherProps = {
  value: SupportedLocale;
  onChange: (locale: SupportedLocale) => void;
};

/**
 * Wraps `@expo/ui`'s universal Picker, which renders the platform-native
 * control: a SwiftUI menu on iOS, a Material 3 dropdown on Android. That is
 * preferable to a hand-built menu — it matches what users expect on each
 * platform and is accessible without extra work.
 */
export function LanguageSwitcher({ value, onChange }: LanguageSwitcherProps) {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <Text variant="label" color="mutedForeground">
        {t('common.language')}
      </Text>

      <Host matchContents>
        <Picker
          selectedValue={value}
          onValueChange={(next) => {
            // The Picker fires on mount on some platforms; ignore a no-op so it
            // cannot trigger a redundant write and re-render.
            if (typeof next === 'string' && next !== value) onChange(next as SupportedLocale);
          }}
        >
          {SUPPORTED_LOCALES.map((locale) => (
            <Picker.Item key={locale} label={LANGUAGE_NAMES[locale]} value={locale} />
          ))}
        </Picker>
      </Host>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    alignItems: 'center',
    gap: theme.spacing[1],
  },
}));
