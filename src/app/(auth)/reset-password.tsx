import { AuthScreenLayout } from '@/components/molecules';
import { AuthMessageCard, ResetPasswordCard } from '@/components/organisms';
import { useResetPassword } from '@/hooks/use-auth';
import { translate } from '@/i18n';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import Toast from 'react-native-toast-message';

export default function ResetPasswordScreen() {
  const router = useRouter();
  // Arrives from the emailed deep link: <scheme>://auth/reset-password?token=...
  const { token } = useLocalSearchParams<{ token?: string }>();
  const resetPasswordMutation = useResetPassword();
  const [isDone, setIsDone] = useState(false);

  const handleResetPassword = (password: string, confirmPassword: string) => {
    if (!token) return;

    resetPasswordMutation.mutate(
      { token, newPassword: password, confirmPassword },
      {
        onSuccess: () => setIsDone(true),
        onError: () => {
          Toast.show({
            type: 'error',
            text1: translate('errors.resetFailed'),
            text2: translate('resetPassword.missingToken'),
          });
        },
      }
    );
  };

  if (!token) {
    return (
      <AuthScreenLayout>
        <AuthMessageCard
          tone="error"
          title={translate('resetPassword.title')}
          message={translate('resetPassword.missingToken')}
          primaryLabel={translate('resetPassword.requestNewLink')}
          onPrimaryPress={() => router.replace('/forgot-password')}
          secondaryLabel={translate('verifyEmail.goToLogin')}
          onSecondaryPress={() => router.replace('/login')}
        />
      </AuthScreenLayout>
    );
  }

  if (isDone) {
    return (
      <AuthScreenLayout>
        <AuthMessageCard
          tone="success"
          title={translate('resetPassword.successTitle')}
          message={translate('resetPassword.successMessage')}
          primaryLabel={translate('verifyEmail.goToLogin')}
          onPrimaryPress={() => router.replace('/login')}
        />
      </AuthScreenLayout>
    );
  }

  return (
    <AuthScreenLayout>
      <ResetPasswordCard onResetPassword={handleResetPassword} isLoading={resetPasswordMutation.isPending} />
    </AuthScreenLayout>
  );
}
