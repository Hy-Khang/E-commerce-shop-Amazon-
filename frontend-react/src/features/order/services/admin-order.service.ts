import { api } from '@/core/api/axios-instance';
import type { SuccessResponse, PaginatedResponse } from '@/core/api/api.types';
import type {
  AdminOrderDetail,
  OrderListItem,
  AdminOrderListParams,
  UpdateOrderStatusRequest,
  UpdatePaymentStatusRequest,
} from '../types/order.types';

export const adminOrderService = {
  getList: (params: AdminOrderListParams) =>
    api.get<PaginatedResponse<OrderListItem>>('/admin/orders', { params }),

  getById: (id: number) =>
    api.get<SuccessResponse<AdminOrderDetail>>(`/admin/orders/${id}`),

  updateStatus: (id: number, data: UpdateOrderStatusRequest) =>
    api.patch<SuccessResponse<AdminOrderDetail>>(`/admin/orders/${id}/status`, data),

  updatePaymentStatus: (id: number, data: UpdatePaymentStatusRequest) =>
    api.patch<SuccessResponse<AdminOrderDetail>>(`/admin/orders/${id}/payment-status`, data),
};
