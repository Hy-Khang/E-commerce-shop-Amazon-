import { useQuery } from '@tanstack/react-query';
import { api } from '@/core/api/axios-instance';
import type { PaginatedResponse } from '@/core/api/api.types';
import type { ProductListItem } from '@/features/product';

/**
 * Fetch a shop's top-selling products for the auto `best_sellers` decoration
 * block. No new endpoint: reuses the public catalog with the existing
 * `shop_id` filter + `sort=best_selling` (visibility-filtered: active product +
 * active shop). A shop with no sales simply returns an empty list.
 */
export function useShopBestSellers(shopId: number | undefined, limit: number) {
  return useQuery({
    queryKey: ['shop', 'best-sellers', shopId, limit] as const,
    queryFn: () =>
      api
        .get<PaginatedResponse<ProductListItem>>('/products', {
          params: { shop_id: shopId, sort: 'best_selling', order: 'desc', limit },
        })
        .then((r) => r.data.data),
    enabled: !!shopId,
    staleTime: 5 * 60 * 1000,
  });
}
