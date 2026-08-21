import { Text } from '@/components/atoms';
import { AuthScreenLayout, LanguageSwitcher } from '@/components/molecules';
import { LoginCard, LoginFooter } from '@/components/organisms';
import { useGoogleLogin, useLogin } from '@/hooks/use-auth';
import { useLocale, useTranslation } from '@/hooks/use-locale';
import { translate } from '@/i18n';
import { useRouter } from 'expo-router';
import { View } from 'react-native';
import Toast from 'react-native-toast-message';
import { StyleSheet } from 'react-native-unistyles';

export default function LoginScreen() {
  const router = useRouter();
  const loginMutation = useLogin();
  const googleLoginMutation = useGoogleLogin();
  const { locale, setLocale } = useLocale();
  const { t } = useTranslation();

  const handleLogin = (email: string, password: string) => {
    loginMutation.mutate(
      { email, password },
      {
        onError: (error) => {
          Toast.show({
            type: 'error',
            text1: translate('errors.loginFailed'),
            text2: error instanceof Error ? error.message : translate('errors.invalidCredentials'),
          });
        },
      }
    );
  };

  const handleGoogleLogin = () => {
    googleLoginMutation.mutate(undefined, {
      onError: (error) => {
        if (error instanceof Error && error.message === 'Google sign-in was cancelled') {
          return;
        }
        console.log('Google login error:', error);
        Toast.show({
          type: 'error',
          text1: translate('errors.loginFailed'),
          text2: error instanceof Error ? error.message : translate('errors.invalidCredentials'),
        });
      },
    });
  };

  const handleAppleLogin = () => {
    // TODO: Implement Apple OAuth
  };

  return (
    <AuthScreenLayout>
      <LoginCard
        onLogin={handleLogin}
        onLoginWithGoogle={handleGoogleLogin}
        onLoginWithApple={handleAppleLogin}
        onForgotPassword={() => router.push('/forgot-password')}
        isLoading={loginMutation.isPending}
      />

      <View style={styles.signUpRow}>
        <Text variant="bodySmall" color="mutedForeground">
          {t('login.noAccount')}
        </Text>
        <Text variant="bodySmall" color="primary" onPress={() => router.push('/register')}>
          {t('login.signUp')}
        </Text>
      </View>

      <LoginFooter />

      <View style={styles.languageRow}>
        <LanguageSwitcher value={locale} onChange={setLocale} hasLabel={false} />
      </View>
    </AuthScreenLayout>
  );
}

const styles = StyleSheet.create((theme) => ({
  signUpRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: theme.spacing[2],
    paddingTop: theme.spacing[5],
  },
  languageRow: {
    paddingTop: theme.spacing[5],
  },
}));
