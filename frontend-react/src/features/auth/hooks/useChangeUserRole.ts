import { useMutation, useQueryClient } from '@tanstack/react-query';
import { adminUserService } from '../services/admin.service';
import { adminUserKeys } from './useAdminUsers';
import type { UpdateUserRoleRequest } from '../types/admin.types';

export function useChangeUserRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateUserRoleRequest }) =>
      adminUserService.changeRole(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminUserKeys.all });
    },
  });
}
