import { useMutation, useQueryClient } from '@tanstack/react-query';
import { sellerShopService } from '../services/seller-shop.service';
import { shopKeys } from './useShop';
import type { DecorationConfig } from '../types/decoration.types';

/**
 * Save (or reset with `null`) the seller's storefront decoration. Invalidates
 * both the seller-side shop cache (`['seller','shop']`) and the public shop
 * detail so the change shows on the live storefront immediately.
 */
export function useUpdateShopDecoration(slug?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (decoration_config: DecorationConfig | null) =>
      sellerShopService.updateShop({ decoration_config }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller', 'shop'] });
      if (slug) {
        queryClient.invalidateQueries({ queryKey: shopKeys.detail(slug) });
      }
    },
  });
}
