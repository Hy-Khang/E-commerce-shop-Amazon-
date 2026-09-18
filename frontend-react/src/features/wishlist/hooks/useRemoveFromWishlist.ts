import { useMutation, useQueryClient } from '@tanstack/react-query';
import { wishlistService } from '../services/wishlist.service';
import { wishlistKeys } from './useWishlist';
import { showSuccessToast } from '@/common/components/feedback/toast';
import { useTranslation } from 'react-i18next';

export function useRemoveFromWishlist() {
  const queryClient = useQueryClient();
  const { t } = useTranslation('toast');

  return useMutation({
    mutationFn: (productId: number) => wishlistService.remove(productId),

    onSuccess: (_data, productId) => {
      queryClient.setQueryData(
        wishlistKeys.check(productId),
        { data: { data: { in_wishlist: false } } },
      );

      queryClient.invalidateQueries({ queryKey: wishlistKeys.all });
      showSuccessToast(t('wishlist.removed'), 'wishlist');
    },
  });
}
