import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Text } from '@/components/atoms';
import { translate } from '@/i18n';

export function LoginFooter() {
  return (
    <View style={styles.container}>
      <Text variant="caption" color="mutedForeground">
        {translate('login.privacyPolicy')}
      </Text>
      <Text variant="caption" color="mutedForeground">
        {translate('login.termsOfService')}
      </Text>
      <Text variant="caption" color="mutedForeground">
        {translate('login.support')}
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
