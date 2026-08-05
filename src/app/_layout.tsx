import { QueryClientProvider } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { queryClient } from '@/lib/query-client';
import { RootNavigator } from '@/navigation';
import { getLocales } from 'expo-localization';
import { i18n } from '@/i18n';

i18n.locale = getLocales()[0]?.languageTag || 'en';
i18n.enableFallback = true;

export default function RootLayout() {
  const insets = useSafeAreaInsets();

  return (
    <QueryClientProvider client={queryClient}>
      <RootNavigator />
      <Toast topOffset={insets.top} />
    </QueryClientProvider>
  );
}
