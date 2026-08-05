import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Text, Button } from '@/components/atoms';

type AuthMessageCardProps = {
  tone?: 'success' | 'error' | 'info';
  title: string;
  message: string;
  primaryLabel?: string;
  onPrimaryPress?: () => void;
  secondaryLabel?: string;
  onSecondaryPress?: () => void;
  isLoading?: boolean;
};

const icons = {
  success: 'check-circle-outline',
  error: 'alert-circle-outline',
  info: 'email-outline',
} as const;

/**
 * Terminal state for the token-based auth flows (email confirmed, reset link
 * sent, link expired). Shared so register / forgot-password / reset-password /
 * verify-email all resolve to the same visual language.
 */
export function AuthMessageCard({
  tone = 'info',
  title,
  message,
  primaryLabel,
  onPrimaryPress,
  secondaryLabel,
  onSecondaryPress,
  isLoading,
}: AuthMessageCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <MaterialCommunityIcons name={icons[tone]} size={48} color={iconStyles[tone].color} />
        <Text variant="h2" style={styles.title}>
          {title}
        </Text>
        <Text variant="bodySmall" color="mutedForeground" style={styles.message}>
          {message}
        </Text>
      </View>

      {(primaryLabel || secondaryLabel) && (
        <View style={styles.actions}>
          {primaryLabel && (
            <Button
              label={primaryLabel}
              variant="primary"
              size="lg"
              fullWidth
              onPress={onPrimaryPress}
              disabled={isLoading}
            />
          )}
          {secondaryLabel && (
            <Button
              label={secondaryLabel}
              variant="ghost"
              size="md"
              fullWidth
              onPress={onSecondaryPress}
              disabled={isLoading}
            />
          )}
        </View>
      )}
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
  header: {
    alignItems: 'center',
    gap: theme.spacing[2],
  },
  title: {
    textAlign: 'center',
  },
  message: {
    textAlign: 'center',
  },
  actions: {
    gap: theme.spacing[3],
  },
}));

const iconStyles = StyleSheet.create((theme) => ({
  success: { color: theme.colors.primary },
  error: { color: theme.colors.destructive },
  info: { color: theme.colors.mutedForeground },
}));
