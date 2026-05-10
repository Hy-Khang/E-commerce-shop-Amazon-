import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useLogin } from './useLogin';
import { mockLoginResponse, createTestQueryClient } from '../tests/mocks/auth.mock';
import { QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { type ReactNode } from 'react';

const mockNavigate = vi.fn();
const mockLocation = { state: null };
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => mockLocation,
  };
});

vi.mock('../services/auth.service', () => ({
  authService: {
    login: vi.fn(),
  },
}));

vi.mock('../stores/auth.store', () => ({
  useAuthStore: vi.fn((selector) => selector({ login: mockStoreLogin })),
}));

const mockStoreLogin = vi.fn();

import { authService } from '../services/auth.service';

function wrapper({ children }: { children: ReactNode }) {
  const queryClient = createTestQueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  );
}

describe('useLogin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call authService.login with credentials', async () => {
    const loginResponse = mockLoginResponse();
    vi.mocked(authService.login).mockResolvedValue({ data: { data: loginResponse } } as never);

    const { result } = renderHook(() => useLogin(), { wrapper });

    result.current.mutate({ email: 'user@example.com', password: 'password123' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(authService.login).toHaveBeenCalledWith({
      email: 'user@example.com',
      password: 'password123',
    });
  });

  it('should store tokens via auth store on success', async () => {
    const loginResponse = mockLoginResponse();
    vi.mocked(authService.login).mockResolvedValue({ data: { data: loginResponse } } as never);

    const { result } = renderHook(() => useLogin(), { wrapper });

    result.current.mutate({ email: 'user@example.com', password: 'password123' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockStoreLogin).toHaveBeenCalledWith(loginResponse);
  });

  it('should navigate to home on success', async () => {
    const loginResponse = mockLoginResponse();
    vi.mocked(authService.login).mockResolvedValue({ data: { data: loginResponse } } as never);

    const { result } = renderHook(() => useLogin(), { wrapper });

    result.current.mutate({ email: 'user@example.com', password: 'password123' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });
  });

  it('should navigate to redirect path from location state', async () => {
    mockLocation.state = { from: { pathname: '/checkout' } } as never;
    const loginResponse = mockLoginResponse();
    vi.mocked(authService.login).mockResolvedValue({ data: { data: loginResponse } } as never);

    const { result } = renderHook(() => useLogin(), { wrapper });

    result.current.mutate({ email: 'user@example.com', password: 'password123' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockNavigate).toHaveBeenCalledWith('/checkout', { replace: true });
    mockLocation.state = null;
  });

  it('should set error state on failure', async () => {
    vi.mocked(authService.login).mockRejectedValue(new Error('Invalid credentials'));

    const { result } = renderHook(() => useLogin(), { wrapper });

    result.current.mutate({ email: 'user@example.com', password: 'wrong' });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error?.message).toBe('Invalid credentials');
  });
});
