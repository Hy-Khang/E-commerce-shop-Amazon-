import { useMutation, useQueryClient } from '@tanstack/react-query';
import { sellerProductService } from '../services/seller-product.service';
import { sellerProductKeys } from './useSellerProducts';
import { showSuccessToast } from '@/common/components/feedback/toast';
import { useTranslation } from '@/common/i18n';
import type { UpdateProductRequest } from '../types/product.types';

export function useSellerUpdateProduct(id: number) {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (data: UpdateProductRequest) => sellerProductService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sellerProductKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: sellerProductKeys.all });
      showSuccessToast(t((m) => m.toast.product.updated));
    },
  });
}
