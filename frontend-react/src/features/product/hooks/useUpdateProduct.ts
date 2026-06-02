import { useMutation, useQueryClient } from '@tanstack/react-query';
import { adminProductService } from '../services/admin-product.service';
import { adminProductKeys } from './useAdminProducts';
import { showSuccessToast } from '@/common/components/feedback/toast';
import { useTranslation } from '@/common/i18n';
import type { UpdateProductRequest } from '../types/product.types';

export function useUpdateProduct(id: number) {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (data: UpdateProductRequest) => adminProductService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminProductKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: adminProductKeys.all });
      showSuccessToast(t((m) => m.toast.product.updated));
    },
  });
}
