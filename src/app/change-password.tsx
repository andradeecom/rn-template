import { AuthScreenLayout } from '@/components/molecules';
import { AuthMessageCard, ChangePasswordCard } from '@/components/organisms';
import { useChangePassword } from '@/hooks/use-auth';
import { translate } from '@/i18n';
import { useAuthStore } from '@/stores/auth';
import type { ChangePasswordRequest } from '@/types/auth';
import { isAxiosError } from 'axios';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import Toast from 'react-native-toast-message';

export default function ChangePasswordScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const changePasswordMutation = useChangePassword();
  const [isDone, setIsDone] = useState(false);

  const handleChangePassword = (payload: ChangePasswordRequest) => {
    changePasswordMutation.mutate(payload, {
      onSuccess: () => setIsDone(true),
      onError: (error) => {
        // The backend returns 400 with a message for a wrong current password.
        const message = isAxiosError(error)
          ? ((error.response?.data as { message?: string } | undefined)?.message ?? translate('errors.generic'))
          : translate('errors.generic');

        Toast.show({
          type: 'error',
          text1: translate('changePassword.failedTitle'),
          text2: message,
        });
      },
    });
  };

  if (isDone) {
    return (
      <AuthScreenLayout>
        <AuthMessageCard
          tone="success"
          title={translate('changePassword.successTitle')}
          message={translate('changePassword.successMessage')}
          primaryLabel={translate('changePassword.backToProfile')}
          onPrimaryPress={() => router.replace('/profile')}
        />
      </AuthScreenLayout>
    );
  }

  return (
    <AuthScreenLayout>
      <ChangePasswordCard
        onChangePassword={handleChangePassword}
        onCancel={() => router.back()}
        requireCurrentPassword={!user?.mustChangePassword}
        isLoading={changePasswordMutation.isPending}
      />
    </AuthScreenLayout>
  );
}
