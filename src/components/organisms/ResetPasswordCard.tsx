import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { useForm, Controller } from 'react-hook-form';
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Text, Button } from '@/components/atoms';
import { InputField } from '@/components/molecules';
import { createResetPasswordSchema, type ResetPasswordFormData } from '@/schemas/reset-password';
import { useTranslation } from '@/hooks/use-locale';

type ResetPasswordCardProps = {
  onResetPassword: (password: string, confirmPassword: string) => void;
  isLoading?: boolean;
};

export function ResetPasswordCard({ onResetPassword, isLoading }: ResetPasswordCardProps) {
  const { t } = useTranslation();
  // The schema embeds translated messages, so it is rebuilt every render to
  // follow the active language.
  const schema = createResetPasswordSchema();
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: standardSchemaResolver(schema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  const onSubmit = (data: ResetPasswordFormData) => {
    onResetPassword(data.password, data.confirmPassword);
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
          {t('resetPassword.title')}
        </Text>
        <Text variant="bodySmall" color="mutedForeground" style={styles.subtitle}>
          {t('resetPassword.subtitle')}
        </Text>
      </View>

      <View style={styles.form}>
        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, onBlur, value } }) => (
            <InputField
              label={t('resetPassword.newPasswordLabel')}
              placeholder={t('resetPassword.newPasswordPlaceholder')}
              secureTextEntry={!isPasswordVisible}
              autoComplete="new-password"
              rightIcon={rightIcon()}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.password?.message}
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
          label={isLoading ? t('resetPassword.submitting') : t('resetPassword.submitButton')}
          variant="primary"
          size="lg"
          fullWidth
          onPress={handleSubmit(onSubmit)}
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
