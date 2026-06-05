import { useMutation, useQueryClient } from '@tanstack/react-query';
import { sellerProductService } from '../services/seller-product.service';
import { sellerProductKeys } from './useSellerProducts';
import { showSuccessToast } from '@/common/components/feedback/toast';
import { useTranslation } from '@/common/i18n';

export function useSellerToggleProductActive() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (id: number) => sellerProductService.toggleActive(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sellerProductKeys.all });
      showSuccessToast(t((m) => m.toast.product.statusUpdated));
    },
  });
}
