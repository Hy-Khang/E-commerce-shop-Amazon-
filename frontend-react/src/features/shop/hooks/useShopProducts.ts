import { useQuery } from '@tanstack/react-query';
import { shopService } from '../services/shop.service';
import { shopKeys } from './useShop';
import type { ProductListParams } from '@/features/product/types/product.types';

export function useShopProducts(slug: string, params: ProductListParams) {
  return useQuery({
    queryKey: shopKeys.products(slug, params),
    queryFn: () => shopService.getProducts(slug, params),
    select: (res) => ({ data: res.data.data, meta: res.data.meta }),
    enabled: !!slug,
  });
}
