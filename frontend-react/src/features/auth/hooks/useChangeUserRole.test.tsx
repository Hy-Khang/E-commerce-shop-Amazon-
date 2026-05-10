import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useChangeUserRole } from './useChangeUserRole';
import { mockAdminUser, createTestQueryClient } from '../tests/mocks/auth.mock';
import { adminUserKeys } from './useAdminUsers';
import { QueryClientProvider } from '@tanstack/react-query';
import { type ReactNode } from 'react';

vi.mock('../services/admin.service', () => ({
  adminUserService: {
    changeRole: vi.fn(),
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

describe('useChangeUserRole', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call adminUserService.changeRole with id and data', async () => {
    const user = mockAdminUser({ id: 5, role: { id: 2, name: 'admin' } });
    vi.mocked(adminUserService.changeRole).mockResolvedValue({
      data: { data: user },
    } as never);

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useChangeUserRole(), { wrapper });

    result.current.mutate({ id: 5, data: { role_id: 2 } });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(adminUserService.changeRole).toHaveBeenCalledWith(5, { role_id: 2 });
  });

  it('should invalidate admin user queries on success', async () => {
    vi.mocked(adminUserService.changeRole).mockResolvedValue({
      data: { data: mockAdminUser() },
    } as never);

    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useChangeUserRole(), { wrapper });

    result.current.mutate({ id: 1, data: { role_id: 2 } });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: adminUserKeys.all });
  });
});
