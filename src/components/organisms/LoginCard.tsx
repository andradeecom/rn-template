import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { useForm, Controller } from 'react-hook-form';
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Text, Button, Divider } from '@/components/atoms';
import { InputField, SocialButton } from '@/components/molecules';
import { createLoginSchema, type LoginFormData } from '@/schemas/login';
import { useTranslation } from '@/hooks/use-locale';

type LoginCardProps = {
  onLogin: (email: string, password: string) => void;
  onLoginWithGoogle: () => void;
  onLoginWithApple: () => void;
  onForgotPassword?: () => void;
  isLoading?: boolean;
};

export function LoginCard({
  onLogin,
  onLoginWithGoogle,
  onLoginWithApple,
  onForgotPassword,
  isLoading,
}: LoginCardProps) {
  const { t } = useTranslation();
  // The schema embeds translated messages, so it is rebuilt every render to
  // follow the active language.
  const schema = createLoginSchema();
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: standardSchemaResolver(schema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = (data: LoginFormData) => {
    onLogin(data.email, data.password);
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
          {t('login.title')}
        </Text>
        <Text variant="bodySmall" color="mutedForeground">
          {t('login.subtitle')}
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
              rightLabel={t('login.forgotPassword')}
              onRightLabelPress={onForgotPassword}
              placeholder={t('login.passwordPlaceholder')}
              secureTextEntry={!isPasswordVisible}
              rightIcon={rightIcon()}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.password?.message}
            />
          )}
        />

        <Button
          label={isLoading ? t('login.signingIn') : t('login.loginButton')}
          variant="primary"
          size="lg"
          fullWidth
          onPress={handleSubmit(onSubmit)}
          disabled={isLoading}
        />
      </View>

      <Divider label={t('login.or')} />

      <View style={styles.socialButtons}>
        <SocialButton provider="google" onPress={onLoginWithGoogle} />
        <SocialButton provider="apple" onPress={onLoginWithApple} />
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
  socialButtons: {
    gap: theme.spacing[3],
  },
  eyeIcon: {
    color: theme.colors.mutedForeground,
  },
}));
