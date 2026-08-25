import { useQuery } from '@tanstack/react-query';
import { sellerProductService } from '../services/seller-product.service';
import type { AdminProductListParams } from '../types/product.types';

export const sellerProductKeys = {
  all: ['seller', 'products'] as const,
  list: (params: AdminProductListParams) => ['seller', 'products', 'list', params] as const,
  detail: (id: number) => ['seller', 'products', 'detail', id] as const,
};

export function useSellerProducts(
  params: AdminProductListParams,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: sellerProductKeys.list(params),
    queryFn: () => sellerProductService.getList(params),
    enabled: options?.enabled,
    select: (res) => ({
      data: res.data.data,
      meta: res.data.meta,
    }),
  });
}
