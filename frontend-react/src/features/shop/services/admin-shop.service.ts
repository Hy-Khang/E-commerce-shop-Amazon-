import { api } from '@/core/api/axios-instance';
import type { SuccessResponse, PaginatedResponse } from '@/core/api/api.types';
import type { AdminShop, AdminShopQueryParams, ShopStatus } from '../types/shop.types';

export const adminShopService = {
  getAll: (params: AdminShopQueryParams) =>
    api.get<PaginatedResponse<AdminShop>>('/admin/shops', { params }),

  getById: (id: number) =>
    api.get<SuccessResponse<AdminShop>>(`/admin/shops/${id}`),

  updateStatus: (id: number, status: ShopStatus) =>
    api.patch<SuccessResponse<AdminShop>>(`/admin/shops/${id}/status`, { status }),
};
