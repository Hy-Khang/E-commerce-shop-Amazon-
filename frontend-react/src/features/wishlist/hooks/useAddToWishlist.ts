import { useMutation, useQueryClient } from '@tanstack/react-query';
import { wishlistService } from '../services/wishlist.service';
import { wishlistKeys } from './useWishlist';
import type { AddToWishlistRequest } from '../types/wishlist.types';

export function useAddToWishlist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: AddToWishlistRequest) =>
      wishlistService.add(data).then((res) => res.data.data),

    onSuccess: (_data, variables) => {
      queryClient.setQueryData(
        wishlistKeys.check(variables.product_id),
        { data: { data: { in_wishlist: true } } },
      );

      queryClient.invalidateQueries({ queryKey: wishlistKeys.all });
    },
  });
}
