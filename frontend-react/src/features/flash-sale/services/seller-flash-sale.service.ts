import { api } from '@/core/api/axios-instance';
import type { SuccessResponse, PaginatedResponse } from '@/core/api/api.types';
import type {
  FlashSale,
  FlashSaleItem,
  FlashRegistrationListParams,
  RegisterFlashSaleItemRequest,
  UpdateFlashSaleItemRequest,
} from '../types/flash-sale.types';

export const sellerFlashSaleService = {
  getOpenCampaigns: () =>
    api.get<SuccessResponse<FlashSale[]>>('/seller/flash-sales'),

  getMyRegistrations: (params: FlashRegistrationListParams) =>
    api.get<PaginatedResponse<FlashSaleItem>>(
      '/seller/flash-sales/registrations',
      { params },
    ),

  getCampaign: (id: number) =>
    api.get<SuccessResponse<FlashSale>>(`/seller/flash-sales/${id}`),

  register: (id: number, data: RegisterFlashSaleItemRequest) =>
    api.post<SuccessResponse<FlashSaleItem>>(
      `/seller/flash-sales/${id}/register`,
      data,
    ),

  updateItem: (itemId: number, data: UpdateFlashSaleItemRequest) =>
    api.patch<SuccessResponse<FlashSaleItem>>(
      `/seller/flash-sales/items/${itemId}`,
      data,
    ),

  withdrawItem: (itemId: number) =>
    api.delete(`/seller/flash-sales/items/${itemId}`),
};
