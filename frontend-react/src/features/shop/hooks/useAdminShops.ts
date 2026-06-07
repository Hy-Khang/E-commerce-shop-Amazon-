import { useQuery } from '@tanstack/react-query';
import { adminShopService } from '../services/admin-shop.service';
import type { AdminShopQueryParams } from '../types/shop.types';

export const adminShopKeys = {
  all: ['admin', 'shops'] as const,
  list: (params: AdminShopQueryParams) => ['admin', 'shops', 'list', params] as const,
  detail: (id: number) => ['admin', 'shops', 'detail', id] as const,
};

export function useAdminShops(params: AdminShopQueryParams) {
  return useQuery({
    queryKey: adminShopKeys.list(params),
    queryFn: () => adminShopService.getAll(params),
    select: (res) => ({
      data: res.data.data,
      meta: res.data.meta,
    }),
  });
}
