import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { flashSaleService } from '../services/flash-sale.service';
import type { FlashSaleItem } from '../types/flash-sale.types';

export const flashSaleKeys = {
  all: ['flash-sales'] as const,
  active: () => ['flash-sales', 'active'] as const,
  detail: (id: number) => ['flash-sales', 'detail', id] as const,
};

export function useActiveFlashSales() {
  return useQuery({
    queryKey: flashSaleKeys.active(),
    queryFn: () => flashSaleService.getActive(),
    select: (res) => res.data.data,
    // Deals are time-sensitive — keep them reasonably fresh.
    staleTime: 30_000,
  });
}

export interface FlashPriceMaps {
  /** variant id → its active flash-sale item (for a selected variant). */
  byVariant: Map<number, FlashSaleItem>;
  /** product id → the cheapest active flash item of that product (for cards). */
  byProduct: Map<number, FlashSaleItem>;
}

/**
 * Overlay helper for the storefront: builds variant- and product-keyed lookups
 * from the active flash campaigns so product cards and the detail page can show
 * the flash price. Backed by the same cached `active` query (one shared fetch).
 */
export function useFlashPriceMaps(): FlashPriceMaps {
  const { data: campaigns } = useActiveFlashSales();

  return useMemo(() => {
    const byVariant = new Map<number, FlashSaleItem>();
    const byProduct = new Map<number, FlashSaleItem>();

    for (const campaign of campaigns ?? []) {
      for (const item of campaign.items) {
        byVariant.set(item.product_variant_id, item);
        if (item.product_id != null) {
          const current = byProduct.get(item.product_id);
          if (!current || item.flash_price < current.flash_price) {
            byProduct.set(item.product_id, item);
          }
        }
      }
    }

    return { byVariant, byProduct };
  }, [campaigns]);
}

export function useFlashSale(id: number) {
  return useQuery({
    queryKey: flashSaleKeys.detail(id),
    queryFn: () => flashSaleService.getById(id),
    select: (res) => res.data.data,
    enabled: id > 0,
  });
}
