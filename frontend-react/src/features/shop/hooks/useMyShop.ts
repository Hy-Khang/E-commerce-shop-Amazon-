import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sellerShopService } from '../services/seller-shop.service';
import type { CreateShopRequest, UpdateShopRequest } from '../types/shop.types';

const myShopKey = ['seller', 'shop'] as const;

export function useMyShop() {
  return useQuery({
    queryKey: myShopKey,
    queryFn: () => sellerShopService.getMyShop(),
    select: (res) => res.data.data,
    retry: false,
  });
}

export function useCreateMyShop() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateShopRequest) => sellerShopService.createShop(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: myShopKey });
    },
  });
}

export function useUpdateMyShop() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateShopRequest) => sellerShopService.updateShop(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: myShopKey });
    },
  });
}
