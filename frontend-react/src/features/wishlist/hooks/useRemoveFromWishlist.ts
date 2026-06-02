import { useMutation, useQueryClient } from '@tanstack/react-query';
import { wishlistService } from '../services/wishlist.service';
import { wishlistKeys } from './useWishlist';
import { showSuccessToast } from '@/common/components/feedback/toast';
import { useTranslation } from '@/common/i18n';

export function useRemoveFromWishlist() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (productId: number) => wishlistService.remove(productId),

    onSuccess: (_data, productId) => {
      queryClient.setQueryData(
        wishlistKeys.check(productId),
        { data: { data: { in_wishlist: false } } },
      );

      queryClient.invalidateQueries({ queryKey: wishlistKeys.all });
      showSuccessToast(t((m) => m.toast.wishlist.removed), 'wishlist');
    },
  });
}
