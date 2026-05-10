import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useToggleActivate } from './useToggleActivate';
import { mockAdminUser, createTestQueryClient } from '../tests/mocks/auth.mock';
import { adminUserKeys } from './useAdminUsers';
import { QueryClientProvider } from '@tanstack/react-query';
import { type ReactNode } from 'react';

vi.mock('../services/admin.service', () => ({
  adminUserService: {
    toggleActivate: vi.fn(),
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

describe('useToggleActivate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call adminUserService.toggleActivate with user id', async () => {
    const user = mockAdminUser({ id: 3, is_active: false });
    vi.mocked(adminUserService.toggleActivate).mockResolvedValue({
      data: { data: user },
    } as never);

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useToggleActivate(), { wrapper });

    result.current.mutate(3);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(adminUserService.toggleActivate).toHaveBeenCalledWith(3);
  });

  it('should invalidate admin user queries on success', async () => {
    vi.mocked(adminUserService.toggleActivate).mockResolvedValue({
      data: { data: mockAdminUser() },
    } as never);

    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useToggleActivate(), { wrapper });

    result.current.mutate(1);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: adminUserKeys.all });
  });
});
