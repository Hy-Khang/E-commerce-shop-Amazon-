import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useLogout } from './useLogout';
import { createTestQueryClient } from '../tests/mocks/auth.mock';
import { QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { type ReactNode } from 'react';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../services/auth.service', () => ({
  authService: {
    logout: vi.fn(),
  },
}));

const mockStoreLogout = vi.fn();
let mockRefreshToken: string | null = 'mock-refresh-token';
vi.mock('../stores/auth.store', () => ({
  useAuthStore: vi.fn((selector) =>
    selector({ logout: mockStoreLogout, refreshToken: mockRefreshToken }),
  ),
}));

import { authService } from '../services/auth.service';

function wrapper({ children }: { children: ReactNode }) {
  const queryClient = createTestQueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  );
}

describe('useLogout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRefreshToken = 'mock-refresh-token';
  });

  it('should call authService.logout with refresh token', async () => {
    vi.mocked(authService.logout).mockResolvedValue({} as never);

    const { result } = renderHook(() => useLogout(), { wrapper });

    result.current.mutate();

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(authService.logout).toHaveBeenCalledWith('mock-refresh-token');
  });

  it('should clear store and navigate to login on settled', async () => {
    vi.mocked(authService.logout).mockResolvedValue({} as never);

    const { result } = renderHook(() => useLogout(), { wrapper });

    result.current.mutate();

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockStoreLogout).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true });
  });

  it('should resolve immediately when no refresh token', async () => {
    mockRefreshToken = null;

    const { result } = renderHook(() => useLogout(), { wrapper });

    result.current.mutate();

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(authService.logout).not.toHaveBeenCalled();
  });

  it('should still logout store even when API call fails', async () => {
    vi.mocked(authService.logout).mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useLogout(), { wrapper });

    result.current.mutate();

    await waitFor(() => expect(mockStoreLogout).toHaveBeenCalled());

    expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true });
  });
});
