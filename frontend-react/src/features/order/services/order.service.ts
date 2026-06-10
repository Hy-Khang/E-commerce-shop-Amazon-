import { api } from '@/core/api/axios-instance';
import type { SuccessResponse, PaginatedResponse } from '@/core/api/api.types';
import type {
  Order,
  OrderListItemWithItems,
  OrderListParams,
  CreateOrderRequest,
  Address,
} from '../types/order.types';

export const orderService = {
  checkout: (data: CreateOrderRequest) =>
    api.post<SuccessResponse<Order>>('/orders', data),

  getList: (params: OrderListParams) =>
    api.get<PaginatedResponse<OrderListItemWithItems>>('/orders', { params }),

  getById: (id: number) =>
    api.get<SuccessResponse<Order>>(`/orders/${id}`),

  cancel: (id: number) =>
    api.patch<SuccessResponse<Order>>(`/orders/${id}/cancel`),

  getAddresses: () =>
    api.get<SuccessResponse<Address[]>>('/addresses'),
};
