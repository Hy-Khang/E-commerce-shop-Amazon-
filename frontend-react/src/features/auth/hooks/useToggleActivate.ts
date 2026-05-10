import { useMutation, useQueryClient } from '@tanstack/react-query';
import { adminUserService } from '../services/admin.service';
import { adminUserKeys } from './useAdminUsers';

export function useToggleActivate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => adminUserService.toggleActivate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminUserKeys.all });
    },
  });
}
