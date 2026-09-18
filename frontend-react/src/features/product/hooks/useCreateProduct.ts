import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { adminProductService } from '../services/admin-product.service';
import { adminProductKeys } from './useAdminProducts';
import { showSuccessToast } from '@/common/components/feedback/toast';
import { useTranslation } from 'react-i18next';
import type { CreateProductRequest } from '../types/product.types';
import { ROUTES } from '@/common/constants/routes';

export function useCreateProduct() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { t } = useTranslation('toast');

  return useMutation({
    mutationFn: (data: CreateProductRequest) => adminProductService.create(data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: adminProductKeys.all });
      showSuccessToast(t('product.created'));
      navigate(ROUTES.ADMIN_PRODUCT_EDIT(res.data.data.id));
    },
  });
}
