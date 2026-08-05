import { Text } from '@/components/atoms';
import { AuthScreenLayout, InputField } from '@/components/molecules';
import { AuthMessageCard } from '@/components/organisms';
import { useResendVerification, useVerifyEmail } from '@/hooks/use-auth';
import { translate } from '@/i18n';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { StyleSheet } from 'react-native-unistyles';

export default function VerifyEmailScreen() {
  const router = useRouter();
  // Arrives from the emailed deep link: <scheme>://auth/verify-email?token=...
  const { token } = useLocalSearchParams<{ token?: string }>();
  const verifyEmailMutation = useVerifyEmail();
  const resendMutation = useResendVerification();

  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'verifying' | 'success' | 'failed'>(token ? 'verifying' : 'idle');

  // The token is single-use, so guard against StrictMode / re-render double fires.
  const hasSubmitted = useRef(false);

  useEffect(() => {
    if (!token || hasSubmitted.current) return;

    hasSubmitted.current = true;
    verifyEmailMutation.mutate(
      { token },
      {
        onSuccess: () => setStatus('success'),
        onError: () => setStatus('failed'),
      }
    );
  }, [token, verifyEmailMutation]);

  const handleResend = () => {
    if (!email) return;

    resendMutation.mutate(
      { email },
      {
        onSuccess: () => {
          Toast.show({
            type: 'success',
            text1: translate('verifyEmail.resentMessage'),
          });
        },
        onError: () => {
          Toast.show({
            type: 'error',
            text1: translate('errors.requestFailed'),
            text2: translate('errors.generic'),
          });
        },
      }
    );
  };

  if (status === 'verifying') {
    return (
      <AuthScreenLayout>
        <View style={styles.pending}>
          <ActivityIndicator />
          <Text variant="bodySmall" color="mutedForeground">
            {translate('verifyEmail.subtitle')}
          </Text>
        </View>
      </AuthScreenLayout>
    );
  }

  if (status === 'success') {
    return (
      <AuthScreenLayout>
        <AuthMessageCard
          tone="success"
          title={translate('verifyEmail.successTitle')}
          message={translate('verifyEmail.successMessage')}
          primaryLabel={translate('verifyEmail.goToLogin')}
          onPrimaryPress={() => router.replace('/login')}
        />
      </AuthScreenLayout>
    );
  }

  // `failed` (expired/used token) and `idle` (opened without a token) both offer
  // a resend, so they share one view.
  return (
    <AuthScreenLayout>
      <View style={styles.stack}>
        <AuthMessageCard
          tone="error"
          title={status === 'failed' ? translate('verifyEmail.failedTitle') : translate('verifyEmail.title')}
          message={status === 'failed' ? translate('verifyEmail.failedMessage') : translate('verifyEmail.missingToken')}
        />

        <View style={styles.resendCard}>
          <Text variant="bodySmall" color="mutedForeground" style={styles.prompt}>
            {translate('verifyEmail.emailPrompt')}
          </Text>

          <InputField
            label={translate('login.emailLabel')}
            placeholder={translate('login.emailPlaceholder')}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            value={email}
            onChangeText={setEmail}
          />

          <Text
            variant="label"
            color="primary"
            style={styles.resendAction}
            onPress={resendMutation.isPending ? undefined : handleResend}
          >
            {resendMutation.isPending ? translate('verifyEmail.resending') : translate('verifyEmail.resendButton')}
          </Text>

          <Text
            variant="bodySmall"
            color="mutedForeground"
            style={styles.prompt}
            onPress={() => router.replace('/login')}
          >
            {translate('verifyEmail.goToLogin')}
          </Text>
        </View>
      </View>
    </AuthScreenLayout>
  );
}

const styles = StyleSheet.create((theme) => ({
  stack: {
    gap: theme.spacing[4],
  },
  pending: {
    alignItems: 'center',
    gap: theme.spacing[3],
  },
  resendCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.xl,
    padding: theme.spacing[6],
    gap: theme.spacing[4],
    ...theme.shadows.lg,
  },
  prompt: {
    textAlign: 'center',
  },
  resendAction: {
    textAlign: 'center',
  },
}));
