import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useAdminRoles, useCreateRole, useUpdateRole, useDeleteRole, adminRoleKeys } from './useAdminRoles';
import { mockRoleWithUserCount, mockRole, createTestQueryClient } from '../tests/mocks/auth.mock';
import { QueryClientProvider } from '@tanstack/react-query';
import { type ReactNode } from 'react';

vi.mock('../services/admin.service', () => ({
  adminRoleService: {
    getAll: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

import { adminRoleService } from '../services/admin.service';

function createWrapper() {
  const queryClient = createTestQueryClient();
  function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }
  return { wrapper: Wrapper, queryClient };
}

describe('adminRoleKeys', () => {
  it('should return correct key structure', () => {
    expect(adminRoleKeys.all).toEqual(['admin', 'roles']);
  });
});

describe('useAdminRoles', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch and select roles data', async () => {
    const roles = [
      mockRoleWithUserCount({ id: 1, name: 'customer', userCount: 10 }),
      mockRoleWithUserCount({ id: 2, name: 'admin', userCount: 2 }),
    ];
    vi.mocked(adminRoleService.getAll).mockResolvedValue({
      data: { data: roles },
    } as never);

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useAdminRoles(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(roles);
  });

  it('should handle loading state', () => {
    vi.mocked(adminRoleService.getAll).mockReturnValue(new Promise(() => {}));

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useAdminRoles(), { wrapper });

    expect(result.current.isLoading).toBe(true);
  });
});

describe('useCreateRole', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call adminRoleService.create and invalidate cache', async () => {
    const newRole = mockRole({ id: 3, name: 'seller' });
    vi.mocked(adminRoleService.create).mockResolvedValue({ data: { data: newRole } } as never);

    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useCreateRole(), { wrapper });

    result.current.mutate({ name: 'seller' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(adminRoleService.create).toHaveBeenCalledWith({ name: 'seller' });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: adminRoleKeys.all });
  });
});

describe('useUpdateRole', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call adminRoleService.update and invalidate cache', async () => {
    const updatedRole = mockRole({ id: 1, name: 'moderator' });
    vi.mocked(adminRoleService.update).mockResolvedValue({ data: { data: updatedRole } } as never);

    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useUpdateRole(), { wrapper });

    result.current.mutate({ id: 1, data: { name: 'moderator' } });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(adminRoleService.update).toHaveBeenCalledWith(1, { name: 'moderator' });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: adminRoleKeys.all });
  });
});

describe('useDeleteRole', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call adminRoleService.delete and invalidate cache', async () => {
    vi.mocked(adminRoleService.delete).mockResolvedValue({} as never);

    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useDeleteRole(), { wrapper });

    result.current.mutate(1);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(adminRoleService.delete).toHaveBeenCalledWith(1);
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: adminRoleKeys.all });
  });
});
