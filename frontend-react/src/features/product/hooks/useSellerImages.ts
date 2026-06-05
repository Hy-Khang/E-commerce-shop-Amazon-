import { useMutation, useQueryClient } from '@tanstack/react-query';
import { sellerProductService } from '../services/seller-product.service';
import { sellerProductKeys } from './useSellerProducts';
import { showSuccessToast } from '@/common/components/feedback/toast';
import { useTranslation } from '@/common/i18n';
import type { CreateImageRequest, UpdateImageRequest } from '../types/product.types';

export function useSellerAddImage(productId: number) {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (data: CreateImageRequest) => sellerProductService.addImage(productId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sellerProductKeys.detail(productId) });
      showSuccessToast(t((m) => m.toast.image.added));
    },
  });
}

export function useSellerUpdateImage(productId: number) {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: ({ imageId, data }: { imageId: number; data: UpdateImageRequest }) =>
      sellerProductService.updateImage(imageId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sellerProductKeys.detail(productId) });
      showSuccessToast(t((m) => m.toast.image.updated));
    },
  });
}

export function useSellerDeleteImage(productId: number) {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (imageId: number) => sellerProductService.deleteImage(imageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sellerProductKeys.detail(productId) });
      showSuccessToast(t((m) => m.toast.image.deleted));
    },
  });
}
