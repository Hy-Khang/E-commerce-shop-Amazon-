import { api } from '@/core/api/axios-instance';
import type { SuccessResponse, PaginatedResponse } from '@/core/api/api.types';
import type {
  AdminOrderDetail,
  OrderListItem,
  ShipperOrderListParams,
} from '../types/order.types';

export const shipperOrderService = {
  getList: (params: ShipperOrderListParams) =>
    api.get<PaginatedResponse<OrderListItem>>('/shipper/orders', { params }),

  getById: (id: number) =>
    api.get<SuccessResponse<AdminOrderDetail>>(`/shipper/orders/${id}`),

  acceptOrder: (id: number) =>
    api.patch<SuccessResponse<AdminOrderDetail>>(`/shipper/orders/${id}/accept`),

  markDelivered: (id: number) =>
    api.patch<SuccessResponse<AdminOrderDetail>>(`/shipper/orders/${id}/deliver`),
};
