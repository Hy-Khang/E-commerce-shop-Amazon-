import { useMutation, useQueryClient } from '@tanstack/react-query';
import { adminProductService } from '../services/admin-product.service';
import { adminProductKeys } from './useAdminProducts';
import { showSuccessToast } from '@/common/components/feedback/toast';
import { useTranslation } from '@/common/i18n';
import type { CreateImageRequest, UpdateImageRequest } from '../types/product.types';

export function useAddImage(productId: number) {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (data: CreateImageRequest) => adminProductService.addImage(productId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminProductKeys.detail(productId) });
      showSuccessToast(t((m) => m.toast.image.added));
    },
  });
}

export function useUpdateImage(productId: number) {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: ({ imageId, data }: { imageId: number; data: UpdateImageRequest }) =>
      adminProductService.updateImage(imageId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminProductKeys.detail(productId) });
      showSuccessToast(t((m) => m.toast.image.updated));
    },
  });
}

export function useDeleteImage(productId: number) {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (imageId: number) => adminProductService.deleteImage(imageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminProductKeys.detail(productId) });
      showSuccessToast(t((m) => m.toast.image.deleted));
    },
  });
}
