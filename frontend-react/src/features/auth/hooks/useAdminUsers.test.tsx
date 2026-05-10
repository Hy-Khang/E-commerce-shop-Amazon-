import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useAdminUsers, adminUserKeys } from './useAdminUsers';
import { mockAdminUser, createTestQueryClient } from '../tests/mocks/auth.mock';
import { QueryClientProvider } from '@tanstack/react-query';
import { type ReactNode } from 'react';

vi.mock('../services/admin.service', () => ({
  adminUserService: {
    getAll: vi.fn(),
  },
}));

import { adminUserService } from '../services/admin.service';

function createWrapper() {
  const queryClient = createTestQueryClient();
  function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }
  return { wrapper: Wrapper, queryClient };
}

describe('adminUserKeys', () => {
  it('should return correct key structures', () => {
    expect(adminUserKeys.all).toEqual(['admin', 'users']);
    expect(adminUserKeys.list({ page: 1, limit: 20 })).toEqual([
      'admin', 'users', 'list', { page: 1, limit: 20 },
    ]);
    expect(adminUserKeys.detail(5)).toEqual(['admin', 'users', 'detail', 5]);
  });
});

describe('useAdminUsers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch and select users data with meta', async () => {
    const users = [
      mockAdminUser({ id: 1 }),
      mockAdminUser({ id: 2, email: 'user2@example.com' }),
    ];
    const meta = { page: 1, limit: 20, total: 2, totalPages: 1 };
    vi.mocked(adminUserService.getAll).mockResolvedValue({
      data: { data: users, meta },
    } as never);

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useAdminUsers({ page: 1, limit: 20 }), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual({ data: users, meta });
  });

  it('should pass query params to service', async () => {
    vi.mocked(adminUserService.getAll).mockResolvedValue({
      data: { data: [], meta: { page: 1, limit: 20, total: 0, totalPages: 0 } },
    } as never);

    const params = { page: 2, limit: 10, search: 'test', role: 'admin' };
    const { wrapper } = createWrapper();
    renderHook(() => useAdminUsers(params), { wrapper });

    await waitFor(() => {
      expect(adminUserService.getAll).toHaveBeenCalledWith(params);
    });
  });
});
