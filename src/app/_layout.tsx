import { QueryClientProvider } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { queryClient } from '@/lib/query-client';
import { RootNavigator } from '@/navigation';
import { i18n } from '@/i18n';

// The active locale is owned by useLocaleStore, which applies the stored
// preference during hydration (see useHydrate). Only the fallback behaviour is
// configured here — assigning i18n.locale at module scope would race that and
// briefly show the device language instead of the chosen one.
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
