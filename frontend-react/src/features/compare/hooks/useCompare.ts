import { useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { ProductListItem } from '@/features/product';
import { compareService } from '../services/compare.service';
import { useCompareStore, MAX_COMPARE } from '../stores/compare.store';

export const compareKeys = {
  all: ['compare'] as const,
  list: (ids: number[]) => ['compare', 'list', ids] as const,
};

/** Preserve the caller-supplied id order for the hydrated products. */
function orderByIds(products: ProductListItem[], ids: number[]): ProductListItem[] {
  const byId = new Map(products.map((p) => [p.id, p]));
  return ids
    .map((id) => byId.get(id))
    .filter((p): p is ProductListItem => p != null);
}

/**
 * Product comparison set. Reads the persisted store's stable `items` reference
 * (Zustand v5 snapshot rule — derive ids with useMemo, never a fresh selector array),
 * hydrates fresh product data via the public catalog, and reconciles the store when
 * a product drops out (went inactive / shop suspended).
 */
export function useCompare() {
  const items = useCompareStore((s) => s.items);
  const add = useCompareStore((s) => s.add);
  const remove = useCompareStore((s) => s.remove);
  const clear = useCompareStore((s) => s.clear);
  const prune = useCompareStore((s) => s.prune);

  const ids = useMemo(() => items.map((i) => i.product_id), [items]);
  const lockedCategoryId = items[0]?.category_id ?? null;

  const query = useQuery({
    queryKey: compareKeys.list(ids),
    queryFn: () =>
      compareService.getByIds(ids).then((r) => orderByIds(r.data.data, ids)),
    enabled: ids.length > 0,
    staleTime: 5 * 60 * 1000,
  });

  // Reconcile: only after a real resolve, drop stored ids the server didn't return.
  // Guarded against loading/error so a transient failure never wipes the store.
  useEffect(() => {
    if (query.isSuccess && query.data) {
      prune(query.data.map((p) => p.id));
    }
  }, [query.isSuccess, query.data, prune]);

  const isInCompare = (productId: number) =>
    items.some((i) => i.product_id === productId);

  /** Whether adding a product of `categoryId` would be accepted right now. */
  const canAdd = (categoryId: number) =>
    items.length < MAX_COMPARE &&
    (items.length === 0 || lockedCategoryId === categoryId);

  return {
    items,
    products: query.data ?? [],
    isLoading: ids.length > 0 && query.isLoading,
    count: items.length,
    lockedCategoryId,
    add,
    remove,
    clear,
    isInCompare,
    canAdd,
  };
}
