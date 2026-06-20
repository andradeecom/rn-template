import { removeAccessToken, setAccessToken } from '@/lib/secure-store';
import { removeStoredUser, setStoredUser } from '@/lib/user-storage';
import { authApi } from '@/services/auth';
import { useAuthStore } from '@/stores/auth';
import type { LoginRequest } from '@/types/auth';
import { GoogleSignin, isSuccessResponse } from '@react-native-google-signin/google-signin';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import NitroCookies from 'react-native-nitro-cookies';

GoogleSignin.configure({
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
});

export const authKeys = {
  me: ['auth', 'me'] as const,
};

export function useLogin() {
  const queryClient = useQueryClient();
  const setAuth = useAuthStore((state) => state.setAuth);

  return useMutation({
    mutationFn: (credentials: LoginRequest) => authApi.login(credentials),
    onSuccess: async (data) => {
      await setAccessToken(data.accessToken);
      await setStoredUser(data.user);
      setAuth(data.user);
      queryClient.setQueryData(authKeys.me, data.user);
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
      await setAccessToken(data.accessToken);
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
    await setAccessToken('mock-access-token');
    await setStoredUser(mockUser);
    setAuth(mockUser);
    queryClient.setQueryData(authKeys.me, mockUser);
  };
}

export function useLogout() {
  const queryClient = useQueryClient();
  const clearAuth = useAuthStore((state) => state.clearAuth);

  return async () => {
    await removeAccessToken();
    await removeStoredUser();
    await NitroCookies.clearAll();
    clearAuth();
    queryClient.clear();
  };
}
