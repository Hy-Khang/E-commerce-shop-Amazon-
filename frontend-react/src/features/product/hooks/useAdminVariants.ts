import { useMutation, useQueryClient } from '@tanstack/react-query';
import { adminProductService } from '../services/admin-product.service';
import { adminProductKeys } from './useAdminProducts';
import type { CreateVariantRequest, UpdateVariantRequest } from '../types/product.types';

export function useAddVariant(productId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateVariantRequest) => adminProductService.addVariant(productId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminProductKeys.detail(productId) });
    },
  });
}

export function useUpdateVariant(productId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ variantId, data }: { variantId: number; data: UpdateVariantRequest }) =>
      adminProductService.updateVariant(variantId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminProductKeys.detail(productId) });
    },
  });
}

export function useDeleteVariant(productId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (variantId: number) => adminProductService.deleteVariant(variantId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminProductKeys.detail(productId) });
    },
  });
}
