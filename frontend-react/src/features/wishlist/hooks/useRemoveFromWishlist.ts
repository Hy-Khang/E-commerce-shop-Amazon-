import { useMutation, useQueryClient } from '@tanstack/react-query';
import { wishlistService } from '../services/wishlist.service';
import { wishlistKeys } from './useWishlist';

export function useRemoveFromWishlist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (productId: number) => wishlistService.remove(productId),

    onSuccess: (_data, productId) => {
      queryClient.setQueryData(
        wishlistKeys.check(productId),
        { data: { data: { in_wishlist: false } } },
      );

      queryClient.invalidateQueries({ queryKey: wishlistKeys.all });
    },
  });
}
