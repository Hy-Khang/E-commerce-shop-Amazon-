import { useQuery } from '@tanstack/react-query';
import { productService } from '../services/product.service';
import type { ProductListParams } from '../types/product.types';

export const productKeys = {
  all: ['products'] as const,
  list: (params: ProductListParams) => ['products', 'list', params] as const,
  detail: (slug: string) => ['products', 'detail', slug] as const,
};

export function useProducts(params: ProductListParams) {
  return useQuery({
    queryKey: productKeys.list(params),
    queryFn: () => productService.getList(params),
    select: (res) => ({
      data: res.data.data,
      meta: res.data.meta,
    }),
  });
}
