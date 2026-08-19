import { AuthScreenLayout } from '@/components/molecules';
import { AuthMessageCard, ResetPasswordCard } from '@/components/organisms';
import { useResetPassword } from '@/hooks/use-auth';
import { translate } from '@/i18n';
import { useTranslation } from '@/hooks/use-locale';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import Toast from 'react-native-toast-message';

export default function ResetPasswordScreen() {
  const router = useRouter();
  // Arrives from the emailed deep link: <scheme>://auth/reset-password?token=...
  const { token } = useLocalSearchParams<{ token?: string }>();
  const resetPasswordMutation = useResetPassword();
  const [isDone, setIsDone] = useState(false);
  const { t } = useTranslation();

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
          title={t('resetPassword.title')}
          message={t('resetPassword.missingToken')}
          primaryLabel={t('resetPassword.requestNewLink')}
          onPrimaryPress={() => router.replace('/forgot-password')}
          secondaryLabel={t('verifyEmail.goToLogin')}
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
          title={t('resetPassword.successTitle')}
          message={t('resetPassword.successMessage')}
          primaryLabel={t('verifyEmail.goToLogin')}
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
