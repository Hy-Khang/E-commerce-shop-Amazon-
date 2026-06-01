import { useQuery } from '@tanstack/react-query';
import { wishlistService } from '../services/wishlist.service';
import type { WishlistListParams } from '../types/wishlist.types';

export const wishlistKeys = {
  all: ['wishlist'] as const,
  list: (params: WishlistListParams) => ['wishlist', 'list', params] as const,
  check: (productId: number) => ['wishlist', 'check', productId] as const,
  bulkCheck: (productIds: number[]) => ['wishlist', 'bulkCheck', productIds] as const,
};

export function useWishlist(params: WishlistListParams) {
  return useQuery({
    queryKey: wishlistKeys.list(params),
    queryFn: () => wishlistService.getList(params),
    staleTime: 60 * 1000,
    select: (res) => ({
      data: res.data.data,
      meta: res.data.meta,
    }),
  });
}
