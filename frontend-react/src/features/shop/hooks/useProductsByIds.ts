import { useQuery } from '@tanstack/react-query';
import { api } from '@/core/api/axios-instance';
import type { PaginatedResponse } from '@/core/api/api.types';
import type { ProductListItem } from '@/features/product';

/** Preserve the caller-supplied (pinned) id order for the hydrated products. */
function orderByIds(products: ProductListItem[], ids: number[]): ProductListItem[] {
  const byId = new Map(products.map((p) => [p.id, p]));
  return ids
    .map((id) => byId.get(id))
    .filter((p): p is ProductListItem => p != null);
}

/**
 * Hydrate a pinned set of products for a `product_grid` decoration block via the
 * public bulk catalog (`GET /products?ids=`, visibility-filtered: active product
 * + active shop), preserving pin order. Same pattern as Compare / Recently
 * Viewed. Hidden products silently drop out, so the returned set may be smaller.
 */
export function useProductsByIds(ids: number[]) {
  return useQuery({
    queryKey: ['shop', 'pinned-products', ids] as const,
    queryFn: () =>
      api
        .get<PaginatedResponse<ProductListItem>>('/products', {
          params: { ids: ids.join(',') },
        })
        .then((r) => orderByIds(r.data.data, ids)),
    enabled: ids.length > 0,
    staleTime: 5 * 60 * 1000,
  });
}
