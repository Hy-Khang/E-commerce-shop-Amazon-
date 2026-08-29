import { api } from '@/core/api/axios-instance';
import type { SuccessResponse } from '@/core/api/api.types';
import type { FlashSale } from '../types/flash-sale.types';

export const flashSaleService = {
  getActive: () => api.get<SuccessResponse<FlashSale[]>>('/flash-sales/active'),

  getById: (id: number) =>
    api.get<SuccessResponse<FlashSale>>(`/flash-sales/${id}`),
};
