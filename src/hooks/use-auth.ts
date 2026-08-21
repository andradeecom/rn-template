import { getAuthPort } from '@/adapters';
import { setStoredUser } from '@/lib/user-storage';
import { useAuthStore } from '@/stores/auth';
import { useLocaleStore } from '@/stores/locale';
import { useThemeStore } from '@/stores/theme';
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
  const hydrateLocale = useLocaleStore((s) => s.hydrate);
  const isLocaleHydrated = useLocaleStore((s) => s.isHydrated);
  const hydrateTheme = useThemeStore((s) => s.hydrate);
  const isThemeHydrated = useThemeStore((s) => s.isHydrated);

  useEffect(() => {
    hydrate();
    hydrateLocale();
    hydrateTheme();
  }, [hydrate, hydrateLocale, hydrateTheme]);

  // The stored language and theme have to be applied before the first screen
  // renders, or it flashes the device language / light mode and then swaps.
  return isHydrated && isLocaleHydrated && isThemeHydrated;
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
    mutationFn: (credentials: LoginRequest) => getAuthPort().login(credentials),
    onSuccess: async (data) => {
      // `data` carries the profile and nothing else. Whatever credential the
      // active provider issued was persisted inside its adapter before this
      // resolved — deliberately not something this layer can see or handle.
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
    mutationFn: (payload: RegisterRequest) => getAuthPort().register(payload),
  });
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: (payload: ForgotPasswordRequest) => getAuthPort().forgotPassword(payload),
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: (payload: ResetPasswordRequest) => getAuthPort().resetPassword(payload),
  });
}

export function useVerifyEmail() {
  return useMutation({
    mutationFn: (payload: VerifyEmailRequest) => getAuthPort().verifyEmail(payload),
  });
}

export function useResendVerification() {
  return useMutation({
    mutationFn: (payload: ResendVerificationRequest) => getAuthPort().resendVerification(payload),
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
    mutationFn: (payload: ChangePasswordRequest) => getAuthPort().changePassword(payload),
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

      return getAuthPort().googleLogin({ idToken });
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
    queryFn: () => getAuthPort().me(),
    enabled: isAuthenticated,
  });
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
      await getAuthPort().logout();
    } catch {
      // Offline or server unreachable — the local session still goes.
    }

    await getAuthPort().clearSession();
    clearAuth();
    queryClient.clear();
  };
}

/** Signs the user out of every device, revoking every credential the account holds. */
export function useLogoutAll() {
  const queryClient = useQueryClient();
  const clearAuth = useAuthStore((state) => state.clearAuth);

  return async () => {
    try {
      await getAuthPort().logoutAll();
    } catch {
      // Fall through to the local clear.
    }

    await getAuthPort().clearSession();
    clearAuth();
    queryClient.clear();
  };
}
