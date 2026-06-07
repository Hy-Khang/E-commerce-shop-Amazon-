import { useMutation, useQueryClient } from '@tanstack/react-query';
import { adminShopService } from '../services/admin-shop.service';
import { adminShopKeys } from './useAdminShops';
import type { ShopStatus } from '../types/shop.types';

export function useUpdateShopStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: ShopStatus }) =>
      adminShopService.updateStatus(id, status),
    onSuccess: (_res, { id }) => {
      queryClient.invalidateQueries({ queryKey: adminShopKeys.all });
      queryClient.invalidateQueries({ queryKey: adminShopKeys.detail(id) });
    },
  });
}
