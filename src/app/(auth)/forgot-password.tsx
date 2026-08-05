import { AuthScreenLayout } from '@/components/molecules';
import { AuthMessageCard, ForgotPasswordCard } from '@/components/organisms';
import { useForgotPassword } from '@/hooks/use-auth';
import { translate } from '@/i18n';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import Toast from 'react-native-toast-message';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const forgotPasswordMutation = useForgotPassword();
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);

  const handleSubmitEmail = (email: string) => {
    forgotPasswordMutation.mutate(
      { email },
      {
        // The endpoint intentionally responds identically whether or not the
        // account exists, so the confirmation screen must not imply it does.
        onSuccess: () => setSubmittedEmail(email),
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

  if (submittedEmail) {
    return (
      <AuthScreenLayout>
        <AuthMessageCard
          tone="info"
          title={translate('forgotPassword.sentTitle')}
          message={translate('forgotPassword.sentMessage', { email: submittedEmail })}
          primaryLabel={translate('forgotPassword.backToLogin')}
          onPrimaryPress={() => router.replace('/login')}
        />
      </AuthScreenLayout>
    );
  }

  return (
    <AuthScreenLayout>
      <ForgotPasswordCard
        onSubmitEmail={handleSubmitEmail}
        onBackToLogin={() => router.replace('/login')}
        isLoading={forgotPasswordMutation.isPending}
      />
    </AuthScreenLayout>
  );
}
