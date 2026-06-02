import { useMutation, useQueryClient } from '@tanstack/react-query';
import { adminProductService } from '../services/admin-product.service';
import { adminProductKeys } from './useAdminProducts';
import { showSuccessToast } from '@/common/components/feedback/toast';
import { useTranslation } from '@/common/i18n';
import type { CreateVariantRequest, UpdateVariantRequest } from '../types/product.types';

export function useAddVariant(productId: number) {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (data: CreateVariantRequest) => adminProductService.addVariant(productId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminProductKeys.detail(productId) });
      showSuccessToast(t((m) => m.toast.variant.added));
    },
  });
}

export function useUpdateVariant(productId: number) {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: ({ variantId, data }: { variantId: number; data: UpdateVariantRequest }) =>
      adminProductService.updateVariant(variantId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminProductKeys.detail(productId) });
      showSuccessToast(t((m) => m.toast.variant.updated));
    },
  });
}

export function useDeleteVariant(productId: number) {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (variantId: number) => adminProductService.deleteVariant(variantId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminProductKeys.detail(productId) });
      showSuccessToast(t((m) => m.toast.variant.deleted));
    },
  });
}
