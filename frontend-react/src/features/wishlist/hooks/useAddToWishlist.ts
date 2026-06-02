import { useMutation, useQueryClient } from '@tanstack/react-query';
import { wishlistService } from '../services/wishlist.service';
import { wishlistKeys } from './useWishlist';
import { showSuccessToast } from '@/common/components/feedback/toast';
import { useTranslation } from '@/common/i18n';
import type { AddToWishlistRequest } from '../types/wishlist.types';

export function useAddToWishlist() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (data: AddToWishlistRequest) =>
      wishlistService.add(data).then((res) => res.data.data),

    onSuccess: (_data, variables) => {
      queryClient.setQueryData(
        wishlistKeys.check(variables.product_id),
        { data: { data: { in_wishlist: true } } },
      );

      queryClient.invalidateQueries({ queryKey: wishlistKeys.all });
      showSuccessToast(t((m) => m.toast.wishlist.added), 'wishlist');
    },
  });
}
