import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { useForm, Controller } from 'react-hook-form';
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Text, Button } from '@/components/atoms';
import { InputField } from '@/components/molecules';
import { createRegisterSchema, type RegisterFormData } from '@/schemas/register';
import { useTranslation } from '@/hooks/use-locale';
import type { RegisterRequest } from '@/types/auth';

type RegisterCardProps = {
  onRegister: (payload: RegisterRequest) => void;
  onSignIn: () => void;
  isLoading?: boolean;
};

export function RegisterCard({ onRegister, onSignIn, isLoading }: RegisterCardProps) {
  const { t } = useTranslation();
  // The schema embeds translated messages, so it is rebuilt every render to
  // follow the active language.
  const schema = createRegisterSchema();
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: standardSchemaResolver(schema),
    defaultValues: { firstName: '', lastName: '', email: '', password: '', confirmPassword: '' },
  });

  const onSubmit = (data: RegisterFormData) => {
    onRegister({
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      password: data.password,
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
          {t('register.title')}
        </Text>
        <Text variant="bodySmall" color="mutedForeground">
          {t('register.subtitle')}
        </Text>
      </View>

      <View style={styles.form}>
        <Controller
          control={control}
          name="firstName"
          render={({ field: { onChange, onBlur, value } }) => (
            <InputField
              label={t('register.firstNameLabel')}
              placeholder={t('register.firstNamePlaceholder')}
              autoCapitalize="words"
              autoComplete="given-name"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.firstName?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="lastName"
          render={({ field: { onChange, onBlur, value } }) => (
            <InputField
              label={t('register.lastNameLabel')}
              placeholder={t('register.lastNamePlaceholder')}
              autoCapitalize="words"
              autoComplete="family-name"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.lastName?.message}
            />
          )}
        />

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

        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, onBlur, value } }) => (
            <InputField
              label={t('login.passwordLabel')}
              placeholder={t('login.passwordPlaceholder')}
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
          label={isLoading ? t('register.submitting') : t('register.submitButton')}
          variant="primary"
          size="lg"
          fullWidth
          onPress={handleSubmit(onSubmit)}
          disabled={isLoading}
        />
      </View>

      <View style={styles.footer}>
        <Text variant="bodySmall" color="mutedForeground">
          {t('register.hasAccount')}
        </Text>
        <Text variant="bodySmall" color="primary" onPress={onSignIn}>
          {t('register.signIn')}
        </Text>
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
  form: {
    gap: theme.spacing[4],
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: theme.spacing[2],
  },
  eyeIcon: {
    color: theme.colors.mutedForeground,
  },
}));
