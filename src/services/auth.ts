import { apiClient } from '@/lib/api-client';
import type { LoginRequest, LoginResponse, RefreshResponse, User } from '@/types/auth';

export const authApi = {
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const { data } = await apiClient.post<LoginResponse>('/auth/login', credentials);
    return data;
  },

  me: async (): Promise<User> => {
    const { data } = await apiClient.get<User>('/auth/me');
    return data;
  },

  refresh: async (): Promise<RefreshResponse> => {
    const { data } = await apiClient.post<RefreshResponse>('/auth/refresh');
    return data;
  },
};
