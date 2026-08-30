import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/features/auth';
import type { ProductListItem } from '@/features/product';
import { recentlyViewedService } from '../services/recently-viewed.service';
import { useRecentlyViewedStore } from '../stores/recently-viewed.store';

export const recentlyViewedKeys = {
  all: ['recently-viewed'] as const,
  list: () => ['recently-viewed', 'list'] as const,
  guest: (ids: number[]) => ['recently-viewed', 'guest', ids] as const,
};

/** Preserve the caller-supplied id order (recency) for the hydrated products. */
function orderByIds(products: ProductListItem[], ids: number[]): ProductListItem[] {
  const byId = new Map(products.map((p) => [p.id, p]));
  return ids
    .map((id) => byId.get(id))
    .filter((p): p is ProductListItem => p != null);
}

/**
 * Recently-viewed products, newest first. Reads the DB for authenticated users,
 * or hydrates the guest localStorage id list via the public catalog.
 */
export function useRecentlyViewed() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  // Select the stable `entries` reference (changes only on add/clear) and derive
  // ids with useMemo — a selector returning a fresh array each render would trip
  // Zustand v5's useSyncExternalStore ("getSnapshot should be cached") loop.
  const entries = useRecentlyViewedStore((s) => s.entries);
  const guestIds = useMemo(() => entries.map((e) => e.product_id), [entries]);

  const authedQuery = useQuery({
    queryKey: recentlyViewedKeys.list(),
    queryFn: () => recentlyViewedService.getList().then((r) => r.data.data),
    enabled: isAuthenticated,
    staleTime: 60 * 1000,
  });

  const guestQuery = useQuery({
    queryKey: recentlyViewedKeys.guest(guestIds),
    queryFn: () =>
      recentlyViewedService
        .getByIds(guestIds)
        .then((r) => orderByIds(r.data.data, guestIds)),
    enabled: !isAuthenticated && guestIds.length > 0,
    staleTime: 5 * 60 * 1000,
  });

  if (isAuthenticated) {
    return { products: authedQuery.data ?? [], isLoading: authedQuery.isLoading };
  }
  return {
    products: guestQuery.data ?? [],
    isLoading: guestIds.length > 0 && guestQuery.isLoading,
  };
}
