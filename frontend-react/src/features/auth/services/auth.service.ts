import { api } from '@/core/api/axios-instance';
import type { SuccessResponse } from '@/core/api/api.types';
import type { LoginRequest, LoginResponse, RegisterRequest, RefreshResponse } from '../types/auth.types';

export const authService = {
  login: (data: LoginRequest) =>
    api.post<SuccessResponse<LoginResponse>>('/auth/login', data),

  register: (data: RegisterRequest) =>
    api.post<SuccessResponse<LoginResponse>>('/auth/register', data),

  refresh: (refreshToken: string) =>
    api.post<SuccessResponse<RefreshResponse>>('/auth/refresh', { refreshToken }),

  logout: (refreshToken: string) =>
    api.post('/auth/logout', { refreshToken }),

  logoutAll: () =>
    api.post('/auth/logout-all'),
};
