import { useMutation, useQueryClient } from '@tanstack/react-query';
import { adminProductService } from '../services/admin-product.service';
import { adminProductKeys } from './useAdminProducts';
import type { UpdateProductRequest } from '../types/product.types';

export function useUpdateProduct(id: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateProductRequest) => adminProductService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminProductKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: adminProductKeys.all });
    },
  });
}
