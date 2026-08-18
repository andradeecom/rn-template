import { clearLocalSession } from '@/lib/api-client';
import { setStoredUser } from '@/lib/user-storage';
import { authApi } from '@/services/auth';
import { useAuthStore } from '@/stores/auth';
import type {
  ChangePasswordRequest,
  ForgotPasswordRequest,
  LoginRequest,
  RegisterRequest,
  ResendVerificationRequest,
  ResetPasswordRequest,
  VerifyEmailRequest,
} from '@/types/auth';
import { GoogleSignin, isSuccessResponse } from '@react-native-google-signin/google-signin';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';

GoogleSignin.configure({
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
});

export const authKeys = {
  me: ['auth', 'me'] as const,
};

/**
 * Restores the persisted session once on launch. Returns whether hydration has
 * finished so the root navigator can hold the UI until the answer is known —
 * rendering before then would flash the login screen at a signed-in user.
 */
export function useHydrate() {
  const hydrate = useAuthStore((s) => s.hydrate);
  const isHydrated = useAuthStore((s) => s.isHydrated);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return isHydrated;
}

/**
 * Keeps the current route and the auth state in sync. Keys off the `(auth)`
 * group rather than `(tabs)` so the cold-start case is covered too: there is no
 * `app/index.tsx`, so on launch no route has resolved yet.
 */
export function useAuthGuard() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!isHydrated) return;

    const inAuthGroup = (segments[0] as string) === '(auth)';

    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/login');
    } else if (isAuthenticated && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, isHydrated, segments, router]);
}

export function useLogin() {
  const queryClient = useQueryClient();
  const setAuth = useAuthStore((state) => state.setAuth);

  return useMutation({
    mutationFn: (credentials: LoginRequest) => authApi.login(credentials),
    onSuccess: async (data) => {
      // The session id arrived as a Set-Cookie header and was written to the
      // keystore by the response interceptor — there is no token in `data`.
      await setStoredUser(data.user);
      setAuth(data.user);
      queryClient.setQueryData(authKeys.me, data.user);
    },
  });
}

/**
 * The password/verification mutations below deliberately do not write to the
 * auth store or query cache: none of these endpoints return a session. The user
 * still has to log in afterwards.
 */
export function useRegister() {
  return useMutation({
    mutationFn: (payload: RegisterRequest) => authApi.register(payload),
  });
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: (payload: ForgotPasswordRequest) => authApi.forgotPassword(payload),
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: (payload: ResetPasswordRequest) => authApi.resetPassword(payload),
  });
}

export function useVerifyEmail() {
  return useMutation({
    mutationFn: (payload: VerifyEmailRequest) => authApi.verifyEmail(payload),
  });
}

export function useResendVerification() {
  return useMutation({
    mutationFn: (payload: ResendVerificationRequest) => authApi.resendVerification(payload),
  });
}

/**
 * Unlike the flows above, this one runs while signed in. The backend clears
 * `mustChangePassword` on success, so the stored/cached user is refreshed to
 * match — otherwise a forced-change user would keep being prompted.
 */
export function useChangePassword() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const setAuth = useAuthStore((state) => state.setAuth);

  return useMutation({
    mutationFn: (payload: ChangePasswordRequest) => authApi.changePassword(payload),
    onSuccess: async () => {
      if (!user?.mustChangePassword) return;

      const updated = { ...user, mustChangePassword: false };
      await setStoredUser(updated);
      setAuth(updated);
      queryClient.setQueryData(authKeys.me, updated);
    },
  });
}

export function useGoogleLogin() {
  const queryClient = useQueryClient();
  const setAuth = useAuthStore((state) => state.setAuth);

  return useMutation({
    mutationFn: async () => {
      await GoogleSignin.hasPlayServices();
      const response = await GoogleSignin.signIn();

      if (!isSuccessResponse(response)) {
        throw new Error('Google sign-in was cancelled');
      }

      const idToken = response.data.idToken;
      if (!idToken) {
        throw new Error('No ID token received from Google');
      }

      return authApi.googleLogin({ idToken });
    },
    onSuccess: async (data) => {
      await setStoredUser(data.user);
      setAuth(data.user);
      queryClient.setQueryData(authKeys.me, data.user);
    },
  });
}

export function useMe() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return useQuery({
    queryKey: authKeys.me,
    queryFn: authApi.me,
    enabled: isAuthenticated,
  });
}

export function useMockLogin() {
  const queryClient = useQueryClient();
  const setAuth = useAuthStore((state) => state.setAuth);

  return async () => {
    const mockUser: import('@/types/auth').User = {
      id: 'mock-user-id',
      email: 'mock@example.com',
      firstName: 'Mock',
      lastName: 'User',
      role: 'admin',
      profileImageUrl: null,
      mustChangePassword: false,
    };
    await setStoredUser(mockUser);
    setAuth(mockUser);
    queryClient.setQueryData(authKeys.me, mockUser);
  };
}

/**
 * Logs out server-side first, then locally.
 *
 * Clearing only the device would leave the session row alive and the id usable
 * by anyone who captured it. Deleting the row is what makes logout mean
 * something. The local clear runs regardless, so a failed network call still
 * signs the user out on this device.
 */
export function useLogout() {
  const queryClient = useQueryClient();
  const clearAuth = useAuthStore((state) => state.clearAuth);

  return async () => {
    try {
      await authApi.logout();
    } catch {
      // Offline or server unreachable — the local session still goes.
    }

    await clearLocalSession();
    clearAuth();
    queryClient.clear();
  };
}

/** Signs the user out of every device by deleting all their session rows. */
export function useLogoutAll() {
  const queryClient = useQueryClient();
  const clearAuth = useAuthStore((state) => state.clearAuth);

  return async () => {
    try {
      await authApi.logoutAll();
    } catch {
      // Fall through to the local clear.
    }

    await clearLocalSession();
    clearAuth();
    queryClient.clear();
  };
}
