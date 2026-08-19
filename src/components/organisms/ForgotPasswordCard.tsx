import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { useForm, Controller } from 'react-hook-form';
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema';
import { Text, Button } from '@/components/atoms';
import { InputField } from '@/components/molecules';
import { createForgotPasswordSchema, type ForgotPasswordFormData } from '@/schemas/forgot-password';
import { useTranslation } from '@/hooks/use-locale';

type ForgotPasswordCardProps = {
  onSubmitEmail: (email: string) => void;
  onBackToLogin: () => void;
  isLoading?: boolean;
};

export function ForgotPasswordCard({ onSubmitEmail, onBackToLogin, isLoading }: ForgotPasswordCardProps) {
  const { t } = useTranslation();
  // The schema embeds translated messages, so it is rebuilt every render to
  // follow the active language.
  const schema = createForgotPasswordSchema();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: standardSchemaResolver(schema),
    defaultValues: { email: '' },
  });

  const onSubmit = (data: ForgotPasswordFormData) => {
    onSubmitEmail(data.email);
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text variant="h2" style={styles.title}>
          {t('forgotPassword.title')}
        </Text>
        <Text variant="bodySmall" color="mutedForeground" style={styles.subtitle}>
          {t('forgotPassword.subtitle')}
        </Text>
      </View>

      <View style={styles.form}>
        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, onBlur, value } }) => (
            <InputField
              label={t('login.emailLabel')}
              placeholder={t('login.emailPlaceholder')}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.email?.message}
            />
          )}
        />

        <Button
          label={isLoading ? t('forgotPassword.submitting') : t('forgotPassword.submitButton')}
          variant="primary"
          size="lg"
          fullWidth
          onPress={handleSubmit(onSubmit)}
          disabled={isLoading}
        />

        <Button label={t('forgotPassword.backToLogin')} variant="ghost" size="md" fullWidth onPress={onBackToLogin} />
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
}));
