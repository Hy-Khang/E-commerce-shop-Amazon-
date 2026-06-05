import { create } from 'zustand';
import { storage } from '@/common/utils/storage.util';
import type { AuthMeResponse, AuthUser, LoginResponse } from '../types/auth.types';

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  login: (data: LoginResponse) => void;
  logout: () => void;
  updateUserState: (data: AuthMeResponse) => void;
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: storage.get<AuthUser>('user'),
  accessToken: localStorage.getItem('accessToken'),
  refreshToken: localStorage.getItem('refreshToken'),
  isAuthenticated: !!localStorage.getItem('accessToken'),

  login: (data) => {
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    storage.set('user', data.user);
    set({
      user: data.user,
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      isAuthenticated: true,
    });
  },

  logout: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    set({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
    });
  },

  updateUserState: (data) => {
    const updatedUser: AuthUser = {
      id: data.id,
      email: data.email,
      full_name: data.full_name,
      role: data.role,
      role_id: data.role_id,
      permissions: data.permissions,
    };
    storage.set('user', updatedUser);
    set({ user: updatedUser });
  },

  hasPermission: (permission) => {
    const user = get().user;
    return user?.permissions?.includes(permission) ?? false;
  },

  hasAnyPermission: (permissions) => {
    const user = get().user;
    if (!user?.permissions) return false;
    return permissions.some((p) => user.permissions.includes(p));
  },
}));
