import { useMutation, useQueryClient } from '@tanstack/react-query';
import { sellerProductService } from '../services/seller-product.service';
import { sellerProductKeys } from './useSellerProducts';
import { showSuccessToast } from '@/common/components/feedback/toast';
import { useTranslation } from 'react-i18next';
import type { CreateVariantRequest, UpdateVariantRequest } from '../types/product.types';

export function useSellerAddVariant(productId: number) {
  const queryClient = useQueryClient();
  const { t } = useTranslation('toast');

  return useMutation({
    mutationFn: (data: CreateVariantRequest) => sellerProductService.addVariant(productId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sellerProductKeys.detail(productId) });
      showSuccessToast(t('variant.added'));
    },
  });
}

export function useSellerUpdateVariant(productId: number) {
  const queryClient = useQueryClient();
  const { t } = useTranslation('toast');

  return useMutation({
    mutationFn: ({ variantId, data }: { variantId: number; data: UpdateVariantRequest }) =>
      sellerProductService.updateVariant(variantId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sellerProductKeys.detail(productId) });
      showSuccessToast(t('variant.updated'));
    },
  });
}

export function useSellerDeleteVariant(productId: number) {
  const queryClient = useQueryClient();
  const { t } = useTranslation('toast');

  return useMutation({
    mutationFn: (variantId: number) => sellerProductService.deleteVariant(variantId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sellerProductKeys.detail(productId) });
      showSuccessToast(t('variant.deleted'));
    },
  });
}
