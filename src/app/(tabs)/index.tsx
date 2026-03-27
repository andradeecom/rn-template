import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native-unistyles';
import { Text } from '@/components/atoms';
import { useAuthStore } from '@/stores/auth';
import { translate } from '@/i18n';

export default function HomeScreen() {
  const user = useAuthStore((state) => state.user);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text variant="h1">{translate('home.greeting', { name: user?.firstName ?? 'Guest' })}</Text>
        <Text variant="bodySmall" color="mutedForeground">
          {translate('home.welcomeBack')}
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create((theme) => ({
  safe: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing[5],
    gap: theme.spacing[2],
  },
}));
