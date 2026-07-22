import { api } from '@/core/api/axios-instance';
import type { SuccessResponse } from '@/core/api/api.types';
import type {
  AuthMeResponse,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  RefreshResponse,
  VerifyEmailRequest,
  ForgotPasswordRequest,
} from '../types/auth.types';

export const authService = {
  login: (data: LoginRequest) =>
    api.post<SuccessResponse<LoginResponse>>('/auth/login', data),

  register: (data: RegisterRequest) =>
    api.post<SuccessResponse<RegisterResponse>>('/auth/register', data),

  verifyEmail: (data: VerifyEmailRequest) =>
    api.post<SuccessResponse<LoginResponse>>('/auth/verify-email', data),

  resendVerification: (email: string) =>
    api.post<SuccessResponse<RegisterResponse>>('/auth/resend-verification', { email }),

  forgotPassword: (data: ForgotPasswordRequest) =>
    api.post<SuccessResponse<{ message: string }>>('/auth/forgot-password', data),

  resetPassword: (data: { token: string; password: string }) =>
    api.post<SuccessResponse<{ message: string }>>('/auth/reset-password', data),

  changePassword: (data: { current_password: string; new_password: string }) =>
    api.post<SuccessResponse<{ message: string }>>('/auth/change-password', data),

  setPassword: (data: { new_password: string }) =>
    api.post<SuccessResponse<{ message: string }>>('/auth/set-password', data),

  refresh: (refreshToken: string) =>
    api.post<SuccessResponse<RefreshResponse>>('/auth/refresh', { refreshToken }),

  logout: (refreshToken: string) =>
    api.post('/auth/logout', { refreshToken }),

  logoutAll: () =>
    api.post('/auth/logout-all'),

  exchangeOAuthCode: (code: string) =>
    api.post<SuccessResponse<LoginResponse>>('/auth/oauth/exchange', { code }),

  getMe: () =>
    api.get<SuccessResponse<AuthMeResponse>>('/auth/me'),
};
