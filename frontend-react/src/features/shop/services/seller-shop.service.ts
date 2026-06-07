import { api } from '@/core/api/axios-instance';
import type { SuccessResponse } from '@/core/api/api.types';
import type { Shop, CreateShopRequest, UpdateShopRequest } from '../types/shop.types';

export const sellerShopService = {
  getMyShop: () =>
    api.get<SuccessResponse<Shop>>('/seller/shop'),

  createShop: (data: CreateShopRequest) =>
    api.post<SuccessResponse<Shop>>('/seller/shop', data),

  updateShop: (data: UpdateShopRequest) =>
    api.patch<SuccessResponse<Shop>>('/seller/shop', data),
};
