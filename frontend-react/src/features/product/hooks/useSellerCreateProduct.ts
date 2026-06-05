import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { sellerProductService } from '../services/seller-product.service';
import { sellerProductKeys } from './useSellerProducts';
import { showSuccessToast } from '@/common/components/feedback/toast';
import { useTranslation } from '@/common/i18n';
import type { CreateProductRequest } from '../types/product.types';
import { ROUTES } from '@/common/constants/routes';

export function useSellerCreateProduct() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (data: CreateProductRequest) => sellerProductService.create(data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: sellerProductKeys.all });
      showSuccessToast(t((m) => m.toast.product.created));
      navigate(ROUTES.SELLER_PRODUCT_EDIT(res.data.data.id));
    },
  });
}
