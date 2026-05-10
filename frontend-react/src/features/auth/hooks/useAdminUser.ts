import { useQuery } from '@tanstack/react-query';
import { adminUserService } from '../services/admin.service';
import { adminUserKeys } from './useAdminUsers';

export function useAdminUser(id: number) {
  return useQuery({
    queryKey: adminUserKeys.detail(id),
    queryFn: () => adminUserService.getById(id),
    select: (res) => res.data.data,
    enabled: id > 0,
  });
}
