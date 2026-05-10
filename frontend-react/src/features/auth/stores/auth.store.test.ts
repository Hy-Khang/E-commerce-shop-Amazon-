import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from './auth.store';
import { mockLoginResponse } from '../tests/mocks/auth.mock';

describe('useAuthStore', () => {
  beforeEach(() => {
    localStorage.clear();
    useAuthStore.setState({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
    });
  });

  it('should have unauthenticated initial state', () => {
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.accessToken).toBeNull();
    expect(state.refreshToken).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });

  describe('login', () => {
    it('should set user and tokens in store', () => {
      const loginData = mockLoginResponse();

      useAuthStore.getState().login(loginData);

      const state = useAuthStore.getState();
      expect(state.user).toEqual(loginData.user);
      expect(state.accessToken).toBe('mock-access-token');
      expect(state.refreshToken).toBe('mock-refresh-token');
      expect(state.isAuthenticated).toBe(true);
    });

    it('should persist tokens to localStorage', () => {
      const loginData = mockLoginResponse();

      useAuthStore.getState().login(loginData);

      expect(localStorage.getItem('accessToken')).toBe('mock-access-token');
      expect(localStorage.getItem('refreshToken')).toBe('mock-refresh-token');
      expect(localStorage.getItem('user')).toBe(JSON.stringify(loginData.user));
    });
  });

  describe('logout', () => {
    it('should clear user and tokens from store', () => {
      useAuthStore.getState().login(mockLoginResponse());

      useAuthStore.getState().logout();

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.accessToken).toBeNull();
      expect(state.refreshToken).toBeNull();
      expect(state.isAuthenticated).toBe(false);
    });

    it('should remove tokens from localStorage', () => {
      useAuthStore.getState().login(mockLoginResponse());

      useAuthStore.getState().logout();

      expect(localStorage.getItem('accessToken')).toBeNull();
      expect(localStorage.getItem('refreshToken')).toBeNull();
      expect(localStorage.getItem('user')).toBeNull();
    });
  });
});
