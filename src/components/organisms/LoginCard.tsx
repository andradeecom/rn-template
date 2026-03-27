import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { useForm, Controller } from 'react-hook-form';
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Text, Button, Divider } from '@/components/atoms';
import { InputField, SocialButton } from '@/components/molecules';
import { createLoginSchema, type LoginFormData } from '@/schemas/login';
import { translate } from '@/i18n';

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
  const schema = useMemo(() => createLoginSchema(), []);
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
        accessibilityLabel={translate(isPasswordVisible ? 'login.hidePassword' : 'login.showPassword')}
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
          {translate('login.title')}
        </Text>
        <Text variant="bodySmall" color="mutedForeground">
          {translate('login.subtitle')}
        </Text>
      </View>

      <View style={styles.form}>
        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, onBlur, value } }) => (
            <InputField
              label={translate('login.emailLabel')}
              placeholder={translate('login.emailPlaceholder')}
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
              label={translate('login.passwordLabel')}
              rightLabel={translate('login.forgotPassword')}
              onRightLabelPress={onForgotPassword}
              placeholder={translate('login.passwordPlaceholder')}
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
          label={isLoading ? translate('login.signingIn') : translate('login.loginButton')}
          variant="primary"
          size="lg"
          fullWidth
          onPress={handleSubmit(onSubmit)}
          disabled={isLoading}
        />
      </View>

      <Divider label={translate('login.or')} />

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
