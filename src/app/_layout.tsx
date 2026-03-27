import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { QueryClientProvider } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { queryClient } from '@/lib/query-client';
import { useAuthStore } from '@/stores/auth';
import { getLocales } from 'expo-localization';
import { i18n } from '@/i18n';

i18n.locale = getLocales()[0]?.languageTag || 'en';
i18n.enableFallback = true;

function useHydrate() {
  const hydrate = useAuthStore((s) => s.hydrate);
  const isHydrated = useAuthStore((s) => s.isHydrated);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return isHydrated;
}

function useAuthGuard() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!isHydrated) return;

    const inAuthGroup = (segments[0] as string) === '(tabs)';

    if (!isAuthenticated && inAuthGroup) {
      router.replace('/login' as never);
    } else if (isAuthenticated && !inAuthGroup) {
      router.replace('/(tabs)' as never);
    }
  }, [isAuthenticated, isHydrated, segments, router]);
}

function RootNavigator() {
  const isHydrated = useHydrate();
  useAuthGuard();

  if (!isHydrated) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}

export default function RootLayout() {
  const insets = useSafeAreaInsets();

  return (
    <QueryClientProvider client={queryClient}>
      <RootNavigator />
      <Toast topOffset={insets.top} />
    </QueryClientProvider>
  );
}
