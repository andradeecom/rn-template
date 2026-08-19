import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { useForm, Controller } from 'react-hook-form';
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Text, Button } from '@/components/atoms';
import { InputField } from '@/components/molecules';
import { createChangePasswordSchema, type ChangePasswordFormData } from '@/schemas/change-password';
import { useTranslation } from '@/hooks/use-locale';
import type { ChangePasswordRequest } from '@/types/auth';

type ChangePasswordCardProps = {
  onChangePassword: (payload: ChangePasswordRequest) => void;
  onCancel: () => void;
  /** Skips the current-password field for users on a temporary password. */
  requireCurrentPassword?: boolean;
  isLoading?: boolean;
};

export function ChangePasswordCard({
  onChangePassword,
  onCancel,
  requireCurrentPassword = true,
  isLoading,
}: ChangePasswordCardProps) {
  const { t } = useTranslation();
  // The schema embeds translated messages, so it is rebuilt every render to
  // follow the active language.
  const schema = createChangePasswordSchema(requireCurrentPassword);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ChangePasswordFormData>({
    resolver: standardSchemaResolver(schema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

  const onSubmit = (data: ChangePasswordFormData) => {
    onChangePassword({
      currentPassword: requireCurrentPassword ? data.currentPassword : undefined,
      newPassword: data.newPassword,
      confirmPassword: data.confirmPassword,
    });
  };

  function rightIcon() {
    return (
      <Pressable
        onPress={() => setIsPasswordVisible((prev) => !prev)}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={t(isPasswordVisible ? 'login.hidePassword' : 'login.showPassword')}
      >
        <MaterialCommunityIcons
          name={isPasswordVisible ? 'eye-off-outline' : 'eye-outline'}
          size={20}
          color={styles.eyeIcon.color}
        />
      </Pressable>
    );
  }

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text variant="h2" style={styles.title}>
          {t('changePassword.title')}
        </Text>
        <Text variant="bodySmall" color="mutedForeground" style={styles.subtitle}>
          {requireCurrentPassword ? t('changePassword.subtitle') : t('changePassword.temporarySubtitle')}
        </Text>
      </View>

      <View style={styles.form}>
        {requireCurrentPassword && (
          <Controller
            control={control}
            name="currentPassword"
            render={({ field: { onChange, onBlur, value } }) => (
              <InputField
                label={t('changePassword.currentPasswordLabel')}
                placeholder={t('changePassword.currentPasswordPlaceholder')}
                secureTextEntry={!isPasswordVisible}
                autoComplete="current-password"
                rightIcon={rightIcon()}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.currentPassword?.message}
              />
            )}
          />
        )}

        <Controller
          control={control}
          name="newPassword"
          render={({ field: { onChange, onBlur, value } }) => (
            <InputField
              label={t('resetPassword.newPasswordLabel')}
              placeholder={t('resetPassword.newPasswordPlaceholder')}
              secureTextEntry={!isPasswordVisible}
              autoComplete="new-password"
              rightIcon={requireCurrentPassword ? undefined : rightIcon()}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.newPassword?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="confirmPassword"
          render={({ field: { onChange, onBlur, value } }) => (
            <InputField
              label={t('register.confirmPasswordLabel')}
              placeholder={t('register.confirmPasswordPlaceholder')}
              secureTextEntry={!isPasswordVisible}
              autoComplete="new-password"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.confirmPassword?.message}
            />
          )}
        />

        <Button
          label={isLoading ? t('changePassword.submitting') : t('changePassword.submitButton')}
          variant="primary"
          size="lg"
          fullWidth
          onPress={handleSubmit(onSubmit)}
          disabled={isLoading}
        />

        <Button
          label={t('changePassword.cancel')}
          variant="ghost"
          size="md"
          fullWidth
          onPress={onCancel}
          disabled={isLoading}
        />
      </View>
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
    gap: theme.spacing[1],
  },
  title: {
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
  },
  form: {
    gap: theme.spacing[4],
  },
  eyeIcon: {
    color: theme.colors.mutedForeground,
  },
}));
