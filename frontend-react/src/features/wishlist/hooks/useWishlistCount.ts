import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useAuthStore } from '@/features/auth';
import { wishlistService } from '../services/wishlist.service';
import { useWishlistStore } from '../stores/wishlist.store';
import { wishlistKeys } from './useWishlist';

export function useWishlistCount() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const setItemCount = useWishlistStore((s) => s.setItemCount);

  const query = useQuery({
    queryKey: wishlistKeys.list({ page: 1, limit: 1 }),
    queryFn: () => wishlistService.getList({ page: 1, limit: 1 }),
    staleTime: 60 * 1000,
    enabled: isAuthenticated,
    select: (res) => res.data.meta.total,
  });

  useEffect(() => {
    if (query.data != null) {
      setItemCount(query.data);
    }
    if (!isAuthenticated) {
      setItemCount(0);
    }
  }, [query.data, isAuthenticated, setItemCount]);

  return query;
}
