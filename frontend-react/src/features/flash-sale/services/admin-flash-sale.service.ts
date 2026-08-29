import { api } from '@/core/api/axios-instance';
import type { SuccessResponse, PaginatedResponse } from '@/core/api/api.types';
import type {
  FlashSale,
  FlashSaleItem,
  FlashSaleListParams,
  FlashRegistrationListParams,
  CreateFlashSaleRequest,
  UpdateFlashSaleRequest,
  ReviewFlashSaleItemRequest,
} from '../types/flash-sale.types';

export const adminFlashSaleService = {
  getList: (params: FlashSaleListParams) =>
    api.get<PaginatedResponse<FlashSale>>('/admin/flash-sales', { params }),

  getById: (id: number) =>
    api.get<SuccessResponse<FlashSale>>(`/admin/flash-sales/${id}`),

  create: (data: CreateFlashSaleRequest) =>
    api.post<SuccessResponse<FlashSale>>('/admin/flash-sales', data),

  update: (id: number, data: UpdateFlashSaleRequest) =>
    api.patch<SuccessResponse<FlashSale>>(`/admin/flash-sales/${id}`, data),

  remove: (id: number) => api.delete(`/admin/flash-sales/${id}`),

  // ── Registration moderation ──

  getRegistrations: (params: FlashRegistrationListParams) =>
    api.get<PaginatedResponse<FlashSaleItem>>(
      '/admin/flash-sales/registrations',
      { params },
    ),

  getCampaignItems: (id: number) =>
    api.get<SuccessResponse<FlashSaleItem[]>>(
      `/admin/flash-sales/${id}/items`,
    ),

  approveItem: (itemId: number) =>
    api.patch<SuccessResponse<FlashSaleItem>>(
      `/admin/flash-sales/items/${itemId}/approve`,
    ),

  rejectItem: (itemId: number, data: ReviewFlashSaleItemRequest) =>
    api.patch<SuccessResponse<FlashSaleItem>>(
      `/admin/flash-sales/items/${itemId}/reject`,
      data,
    ),

  removeItem: (itemId: number) =>
    api.delete(`/admin/flash-sales/items/${itemId}`),
};
