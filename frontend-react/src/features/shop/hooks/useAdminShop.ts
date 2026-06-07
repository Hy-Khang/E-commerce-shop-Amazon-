import { useQuery } from '@tanstack/react-query';
import { adminShopService } from '../services/admin-shop.service';
import { adminShopKeys } from './useAdminShops';

export function useAdminShop(id: number) {
  return useQuery({
    queryKey: adminShopKeys.detail(id),
    queryFn: () => adminShopService.getById(id),
    select: (res) => res.data.data,
    enabled: id > 0,
  });
}
