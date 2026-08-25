import { useQuery } from '@tanstack/react-query';
import { adminProductService } from '../services/admin-product.service';
import type { AdminProductListParams } from '../types/product.types';

export const adminProductKeys = {
  all: ['admin', 'products'] as const,
  list: (params: AdminProductListParams) => ['admin', 'products', 'list', params] as const,
  detail: (id: number) => ['admin', 'products', 'detail', id] as const,
};

export function useAdminProducts(
  params: AdminProductListParams,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: adminProductKeys.list(params),
    queryFn: () => adminProductService.getList(params),
    enabled: options?.enabled,
    select: (res) => ({
      data: res.data.data,
      meta: res.data.meta,
    }),
  });
}
