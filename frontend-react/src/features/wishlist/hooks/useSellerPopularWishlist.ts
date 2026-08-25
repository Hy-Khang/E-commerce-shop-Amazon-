import { useQuery } from '@tanstack/react-query';
import { sellerWishlistService } from '../services/seller-wishlist.service';
import type { AdminPopularWishlistParams } from '../types/wishlist.types';

export const sellerWishlistKeys = {
  all: ['seller', 'wishlist'] as const,
  popular: (params: AdminPopularWishlistParams) => ['seller', 'wishlist', 'popular', params] as const,
};

export function useSellerPopularWishlist(params: AdminPopularWishlistParams) {
  return useQuery({
    queryKey: sellerWishlistKeys.popular(params),
    queryFn: () => sellerWishlistService.getPopular(params),
    select: (res) => ({
      data: res.data.data,
      meta: res.data.meta,
    }),
  });
}
