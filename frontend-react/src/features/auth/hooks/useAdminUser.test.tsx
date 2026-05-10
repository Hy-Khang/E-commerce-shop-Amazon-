import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useAdminUser } from './useAdminUser';
import { mockAdminUserDetail, createTestQueryClient } from '../tests/mocks/auth.mock';
import { QueryClientProvider } from '@tanstack/react-query';
import { type ReactNode } from 'react';

vi.mock('../services/admin.service', () => ({
  adminUserService: {
    getById: vi.fn(),
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

describe('useAdminUser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch and select user detail data', async () => {
    const userDetail = mockAdminUserDetail({ id: 5 });
    vi.mocked(adminUserService.getById).mockResolvedValue({
      data: { data: userDetail },
    } as never);

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useAdminUser(5), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(userDetail);
    expect(adminUserService.getById).toHaveBeenCalledWith(5);
  });

  it('should not fetch when id is 0', () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useAdminUser(0), { wrapper });

    expect(result.current.fetchStatus).toBe('idle');
    expect(adminUserService.getById).not.toHaveBeenCalled();
  });

  it('should not fetch when id is negative', () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useAdminUser(-1), { wrapper });

    expect(result.current.fetchStatus).toBe('idle');
    expect(adminUserService.getById).not.toHaveBeenCalled();
  });
});
