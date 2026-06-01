import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/features/auth';
import { wishlistService } from '../services/wishlist.service';
import { wishlistKeys } from './useWishlist';

export function useBulkCheckWishlist(productIds: number[]) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return useQuery({
    queryKey: wishlistKeys.bulkCheck(productIds),
    queryFn: () =>
      wishlistService.bulkCheck({ product_ids: productIds }).then((res) => res.data.data.items),
    staleTime: 60 * 1000,
    enabled: isAuthenticated && productIds.length > 0,
  });
}
