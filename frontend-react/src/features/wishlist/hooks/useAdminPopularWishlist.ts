import { useQuery } from '@tanstack/react-query';
import { adminWishlistService } from '../services/admin-wishlist.service';
import type { AdminPopularWishlistParams } from '../types/wishlist.types';

export const adminWishlistKeys = {
  all: ['admin', 'wishlist'] as const,
  popular: (params: AdminPopularWishlistParams) => ['admin', 'wishlist', 'popular', params] as const,
};

export function useAdminPopularWishlist(params: AdminPopularWishlistParams) {
  return useQuery({
    queryKey: adminWishlistKeys.popular(params),
    queryFn: () => adminWishlistService.getPopular(params),
    select: (res) => ({
      data: res.data.data,
      meta: res.data.meta,
    }),
  });
}
