import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/features/auth';
import { wishlistService } from '../services/wishlist.service';
import { wishlistKeys } from './useWishlist';

export function useCheckWishlist(productId: number) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return useQuery({
    queryKey: wishlistKeys.check(productId),
    queryFn: () => wishlistService.check(productId),
    staleTime: 60 * 1000,
    enabled: isAuthenticated && productId > 0,
    select: (res) => res.data.data.in_wishlist,
  });
}
