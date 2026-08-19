import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Text } from '@/components/atoms';
import { useTranslation } from '@/hooks/use-locale';

export function LoginFooter() {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <Text variant="caption" color="mutedForeground">
        {t('login.privacyPolicy')}
      </Text>
      <Text variant="caption" color="mutedForeground">
        {t('login.termsOfService')}
      </Text>
      <Text variant="caption" color="mutedForeground">
        {t('login.support')}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: theme.spacing[5],
    paddingVertical: theme.spacing[4],
  },
}));
