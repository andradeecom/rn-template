import { AuthScreenLayout } from '@/components/molecules';
import { AuthMessageCard, RegisterCard } from '@/components/organisms';
import { useRegister } from '@/hooks/use-auth';
import { translate } from '@/i18n';
import type { RegisterRequest } from '@/types/auth';
import { isAxiosError } from 'axios';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import Toast from 'react-native-toast-message';

export default function RegisterScreen() {
  const router = useRouter();
  const registerMutation = useRegister();
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null);

  const handleRegister = (payload: RegisterRequest) => {
    registerMutation.mutate(payload, {
      onSuccess: () => setRegisteredEmail(payload.email),
      onError: (error) => {
        // The backend answers a duplicate email with 409 Conflict.
        const isConflict = isAxiosError(error) && error.response?.status === 409;
        Toast.show({
          type: 'error',
          text1: translate('errors.registerFailed'),
          text2: isConflict ? translate('errors.emailAlreadyInUse') : translate('errors.generic'),
        });
      },
    });
  };

  if (registeredEmail) {
    return (
      <AuthScreenLayout>
        <AuthMessageCard
          tone="info"
          title={translate('register.successTitle')}
          message={translate('register.successMessage', { email: registeredEmail })}
          primaryLabel={translate('verifyEmail.goToLogin')}
          onPrimaryPress={() => router.replace('/login')}
        />
      </AuthScreenLayout>
    );
  }

  return (
    <AuthScreenLayout>
      <RegisterCard
        onRegister={handleRegister}
        onSignIn={() => router.replace('/login')}
        isLoading={registerMutation.isPending}
      />
    </AuthScreenLayout>
  );
}
