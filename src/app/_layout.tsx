import React from 'react';
import { useColorScheme } from 'react-native';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { getLocales } from 'expo-localization';
import { AnimatedSplashOverlay } from '@/components/animated-icon';
import AppTabs from '@/components/app-tabs';
import Toast from 'react-native-toast-message';
import { i18n } from '@/i18n';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

i18n.locale = getLocales()[0]?.languageTag || 'en';
i18n.enableFallback = true;

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />
      <AppTabs />
      <Toast topOffset={insets.top} />
    </ThemeProvider>
  );
}
