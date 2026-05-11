import { useMutation, useQueryClient } from '@tanstack/react-query';
import { adminProductService } from '../services/admin-product.service';
import { adminProductKeys } from './useAdminProducts';

export function useToggleProductActive() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => adminProductService.toggleActive(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminProductKeys.all });
    },
  });
}
