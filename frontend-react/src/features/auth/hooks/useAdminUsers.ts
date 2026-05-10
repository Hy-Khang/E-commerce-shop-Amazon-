import { useQuery } from '@tanstack/react-query';
import { adminUserService } from '../services/admin.service';
import type { AdminUserQueryParams } from '../types/admin.types';

export const adminUserKeys = {
  all: ['admin', 'users'] as const,
  list: (params: AdminUserQueryParams) => ['admin', 'users', 'list', params] as const,
  detail: (id: number) => ['admin', 'users', 'detail', id] as const,
};

export function useAdminUsers(params: AdminUserQueryParams) {
  return useQuery({
    queryKey: adminUserKeys.list(params),
    queryFn: () => adminUserService.getAll(params),
    select: (res) => ({
      data: res.data.data,
      meta: res.data.meta,
    }),
  });
}
