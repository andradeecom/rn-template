import { Stack } from 'expo-router';
import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router/react-navigation';
import { ActivityIndicator, useColorScheme, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { useAuthGuard, useHydrate } from '@/hooks/use-auth';

/**
 * Holds the UI until the persisted session has been read, then renders the
 * top-level stack. Rendering before hydration finishes would briefly show the
 * login screen to an already signed-in user.
 *
 * The `ThemeProvider` is required by the native tabs in `TabsNavigator`: without
 * it, header buttons flicker when switching tabs.
 */
export function RootNavigator() {
  const isHydrated = useHydrate();
  const colorScheme = useColorScheme();
  useAuthGuard();

  if (!isHydrated) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="change-password" options={{ presentation: 'modal' }} />
      </Stack>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create((theme) => ({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
}));
