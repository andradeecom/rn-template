import { apiClient } from '@/lib/api-client';
import type {
  LoginRequest,
  GoogleLoginRequest,
  LoginResponse,
  RefreshResponse,
  RegisterRequest,
  RegisterResponse,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  ChangePasswordRequest,
  VerifyEmailRequest,
  ResendVerificationRequest,
  MessageResponse,
  User,
} from '@/types/auth';

export const authApi = {
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const { data } = await apiClient.post<LoginResponse>('/auth/login', credentials);
    return data;
  },

  register: async (payload: RegisterRequest): Promise<RegisterResponse> => {
    const { data } = await apiClient.post<RegisterResponse>('/auth/register', payload);
    return data;
  },

  forgotPassword: async (payload: ForgotPasswordRequest): Promise<MessageResponse> => {
    const { data } = await apiClient.post<MessageResponse>('/auth/forgot-password', payload);
    return data;
  },

  resetPassword: async (payload: ResetPasswordRequest): Promise<MessageResponse> => {
    const { data } = await apiClient.post<MessageResponse>('/auth/reset-password', payload);
    return data;
  },

  changePassword: async (payload: ChangePasswordRequest): Promise<MessageResponse> => {
    const { data } = await apiClient.post<MessageResponse>('/auth/change-password', payload);
    return data;
  },

  verifyEmail: async (payload: VerifyEmailRequest): Promise<MessageResponse> => {
    const { data } = await apiClient.post<MessageResponse>('/auth/verify-email', payload);
    return data;
  },

  resendVerification: async (payload: ResendVerificationRequest): Promise<MessageResponse> => {
    const { data } = await apiClient.post<MessageResponse>('/auth/resend-verification', payload);
    return data;
  },

  googleLogin: async (request: GoogleLoginRequest): Promise<LoginResponse> => {
    const { data } = await apiClient.post<LoginResponse>('/auth/google/token', request);
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
