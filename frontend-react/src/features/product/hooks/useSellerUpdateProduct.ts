import { useMutation, useQueryClient } from '@tanstack/react-query';
import { sellerProductService } from '../services/seller-product.service';
import { sellerProductKeys } from './useSellerProducts';
import { showSuccessToast } from '@/common/components/feedback/toast';
import { useTranslation } from 'react-i18next';
import type { UpdateProductRequest } from '../types/product.types';

export function useSellerUpdateProduct(id: number) {
  const queryClient = useQueryClient();
  const { t } = useTranslation('toast');

  return useMutation({
    mutationFn: (data: UpdateProductRequest) => sellerProductService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sellerProductKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: sellerProductKeys.all });
      showSuccessToast(t('product.updated'));
    },
  });
}
