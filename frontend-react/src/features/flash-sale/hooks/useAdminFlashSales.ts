import { useQuery } from '@tanstack/react-query';
import { adminFlashSaleService } from '../services/admin-flash-sale.service';
import type {
  FlashSaleListParams,
  FlashRegistrationListParams,
} from '../types/flash-sale.types';

export const adminFlashSaleKeys = {
  all: ['admin', 'flash-sales'] as const,
  list: (params: FlashSaleListParams) =>
    ['admin', 'flash-sales', 'list', params] as const,
  detail: (id: number) => ['admin', 'flash-sales', 'detail', id] as const,
  registrations: (params: FlashRegistrationListParams) =>
    ['admin', 'flash-sales', 'registrations', params] as const,
  items: (id: number) => ['admin', 'flash-sales', 'items', id] as const,
};

export function useAdminFlashSales(params: FlashSaleListParams) {
  return useQuery({
    queryKey: adminFlashSaleKeys.list(params),
    queryFn: () => adminFlashSaleService.getList(params),
    select: (res) => ({ data: res.data.data, meta: res.data.meta }),
  });
}

export function useAdminFlashSale(id: number) {
  return useQuery({
    queryKey: adminFlashSaleKeys.detail(id),
    queryFn: () => adminFlashSaleService.getById(id),
    select: (res) => res.data.data,
    enabled: id > 0,
  });
}

/** Global registration moderation queue. */
export function useFlashRegistrations(params: FlashRegistrationListParams) {
  return useQuery({
    queryKey: adminFlashSaleKeys.registrations(params),
    queryFn: () => adminFlashSaleService.getRegistrations(params),
    select: (res) => ({ data: res.data.data, meta: res.data.meta }),
  });
}

/** All registrations for one campaign (moderation drawer). */
export function useCampaignRegistrations(id: number, enabled = true) {
  return useQuery({
    queryKey: adminFlashSaleKeys.items(id),
    queryFn: () => adminFlashSaleService.getCampaignItems(id),
    select: (res) => res.data.data,
    enabled: enabled && id > 0,
  });
}
