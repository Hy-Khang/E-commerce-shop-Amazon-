import { useQuery } from '@tanstack/react-query';
import { sellerFlashSaleService } from '../services/seller-flash-sale.service';
import type { FlashRegistrationListParams } from '../types/flash-sale.types';

export const sellerFlashSaleKeys = {
  all: ['seller', 'flash-sales'] as const,
  open: () => ['seller', 'flash-sales', 'open'] as const,
  registrations: (params: FlashRegistrationListParams) =>
    ['seller', 'flash-sales', 'registrations', params] as const,
  detail: (id: number) => ['seller', 'flash-sales', 'detail', id] as const,
};

/** Campaigns currently open for the seller to register products into. */
export function useOpenFlashCampaigns() {
  return useQuery({
    queryKey: sellerFlashSaleKeys.open(),
    queryFn: () => sellerFlashSaleService.getOpenCampaigns(),
    select: (res) => res.data.data,
    // Registration windows are time-sensitive — keep them reasonably fresh.
    staleTime: 30_000,
  });
}

/** The current shop's registrations across all campaigns. */
export function useMyFlashRegistrations(params: FlashRegistrationListParams) {
  return useQuery({
    queryKey: sellerFlashSaleKeys.registrations(params),
    queryFn: () => sellerFlashSaleService.getMyRegistrations(params),
    select: (res) => ({ data: res.data.data, meta: res.data.meta }),
  });
}

export function useSellerFlashCampaign(id: number, enabled = true) {
  return useQuery({
    queryKey: sellerFlashSaleKeys.detail(id),
    queryFn: () => sellerFlashSaleService.getCampaign(id),
    select: (res) => res.data.data,
    enabled: enabled && id > 0,
  });
}
