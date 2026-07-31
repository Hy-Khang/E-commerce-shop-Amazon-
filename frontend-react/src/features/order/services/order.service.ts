import { api } from '@/core/api/axios-instance';
import type { SuccessResponse, PaginatedResponse } from '@/core/api/api.types';
import type {
  Order,
  OrderListItemWithItems,
  OrderListParams,
  CreateOrderRequest,
  CheckoutResponse,
  Address,
} from '../types/order.types';

export const orderService = {
  checkout: (data: CreateOrderRequest) =>
    api.post<SuccessResponse<CheckoutResponse>>('/orders', data),

  getList: (params: OrderListParams) =>
    api.get<PaginatedResponse<OrderListItemWithItems>>('/orders', { params }),

  getById: (id: number) =>
    api.get<SuccessResponse<Order>>(`/orders/${id}`),

  getByGroupId: (groupId: string) =>
    api.get<SuccessResponse<Order[]>>(`/orders/group/${groupId}`),

  cancel: (id: number) =>
    api.patch<SuccessResponse<Order>>(`/orders/${id}/cancel`),

  confirmReceipt: (id: number) =>
    api.patch<SuccessResponse<Order>>(`/orders/${id}/confirm-receipt`),

  requestReturn: (id: number) =>
    api.patch<SuccessResponse<Order>>(`/orders/${id}/return-request`),

  getAddresses: () =>
    api.get<SuccessResponse<Address[]>>('/addresses'),
};
