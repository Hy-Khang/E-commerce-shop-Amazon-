import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useRegister } from './useRegister';
import { createTestQueryClient } from '../tests/mocks/auth.mock';
import type { RegisterResponse } from '../types/auth.types';

function mockRegisterResponse(overrides: Partial<RegisterResponse> = {}): RegisterResponse {
  return {
    email: 'user@example.com',
    expiresIn: 300,
    message: 'Verification code sent',
    ...overrides,
  };
}
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
    register: vi.fn(),
  },
}));

const mockStoreLogin = vi.fn();
vi.mock('../stores/auth.store', () => ({
  useAuthStore: vi.fn((selector) => selector({ login: mockStoreLogin })),
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

describe('useRegister', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call authService.register without confirmPassword', async () => {
    vi.mocked(authService.register).mockResolvedValue({ data: { data: mockRegisterResponse() } } as never);

    const { result } = renderHook(() => useRegister(), { wrapper });

    result.current.mutate({
      full_name: 'Nguyen Van A',
      email: 'user@example.com',
      password: 'password123',
      confirmPassword: 'password123',
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(authService.register).toHaveBeenCalledWith({
      full_name: 'Nguyen Van A',
      email: 'user@example.com',
      password: 'password123',
    });
  });

  it('should NOT auto-login on success (email verification required first)', async () => {
    vi.mocked(authService.register).mockResolvedValue({ data: { data: mockRegisterResponse() } } as never);

    const { result } = renderHook(() => useRegister(), { wrapper });

    result.current.mutate({
      full_name: 'Nguyen Van A',
      email: 'user@example.com',
      password: 'password123',
      confirmPassword: 'password123',
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockStoreLogin).not.toHaveBeenCalled();
  });

  it('should navigate to the verify-email page with the email on success', async () => {
    vi.mocked(authService.register).mockResolvedValue({
      data: { data: mockRegisterResponse({ email: 'user@example.com' }) },
    } as never);

    const { result } = renderHook(() => useRegister(), { wrapper });

    result.current.mutate({
      full_name: 'Nguyen Van A',
      email: 'user@example.com',
      password: 'password123',
      confirmPassword: 'password123',
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockNavigate).toHaveBeenCalledWith('/verify-email?email=user%40example.com', {
      replace: true,
    });
  });

  it('should set error state on failure', async () => {
    vi.mocked(authService.register).mockRejectedValue(new Error('Email already exists'));

    const { result } = renderHook(() => useRegister(), { wrapper });

    result.current.mutate({
      full_name: 'Nguyen Van A',
      email: 'taken@example.com',
      password: 'password123',
      confirmPassword: 'password123',
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error?.message).toBe('Email already exists');
  });
});
