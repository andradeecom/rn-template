import { ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native-unistyles';
import { LoginCard, LoginFooter } from '@/components/organisms';
import { useLogin } from '@/hooks/use-auth';
import { translate } from '@/i18n';
import Toast from 'react-native-toast-message';

export default function LoginScreen() {
  const loginMutation = useLogin();

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
    // TODO: Implement Google OAuth
  };

  const handleAppleLogin = () => {
    // TODO: Implement Apple OAuth
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={styles.keyboard} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <LoginCard
            onLogin={handleLogin}
            onLoginWithGoogle={handleGoogleLogin}
            onLoginWithApple={handleAppleLogin}
            isLoading={loginMutation.isPending}
          />
          <LoginFooter />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create((theme) => ({
  safe: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  keyboard: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing[5],
    paddingVertical: theme.spacing[6],
  },
}));
