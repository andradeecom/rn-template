import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Text, Avatar, Button } from '@/components/atoms';
import { translate } from '@/i18n';

type ProfileCardProps = {
  name: string;
  email: string;
  avatar?: string;
  onLogout: () => void;
};

export function ProfileCard({ name, email, avatar, onLogout }: ProfileCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.info}>
        <Avatar uri={avatar} fallback={name} size="xl" />
        <Text variant="h3">{name}</Text>
        <Text variant="bodySmall" color="mutedForeground">
          {email}
        </Text>
      </View>

      <View style={styles.section}>
        <View style={styles.row}>
          <Text variant="label">{translate('profile.account')}</Text>
          <Text variant="bodySmall" color="mutedForeground">
            {email}
          </Text>
        </View>
        <View style={styles.separator} />
        <View style={styles.row}>
          <Text variant="label">{translate('profile.theme')}</Text>
          <Text variant="bodySmall" color="mutedForeground">
            {translate('profile.themeSystem')}
          </Text>
        </View>
        <View style={styles.separator} />
        <View style={styles.row}>
          <Text variant="label">{translate('profile.notifications')}</Text>
          <Text variant="bodySmall" color="mutedForeground">
            {translate('profile.notificationsEnabled')}
          </Text>
        </View>
      </View>

      <Button label={translate('common.signOut')} variant="outline" fullWidth onPress={onLogout} />
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.xl,
    padding: theme.spacing[6],
    gap: theme.spacing[6],
    ...theme.shadows.lg,
  },
  info: {
    alignItems: 'center',
    gap: theme.spacing[2],
  },
  section: {
    backgroundColor: theme.colors.muted,
    borderRadius: theme.radius.lg,
    padding: theme.spacing[4],
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing[2],
  },
  separator: {
    height: 1,
    backgroundColor: theme.colors.border,
  },
}));
