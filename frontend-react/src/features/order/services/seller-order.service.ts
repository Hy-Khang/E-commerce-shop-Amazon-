import { api } from '@/core/api/axios-instance';
import type { SuccessResponse, PaginatedResponse } from '@/core/api/api.types';
import type {
  SellerOrderDetail,
  OrderListItem,
  SellerOrderListParams,
  UpdateOrderStatusRequest,
  UpdatePaymentStatusRequest,
} from '../types/order.types';

export const sellerOrderService = {
  getList: (params: SellerOrderListParams) =>
    api.get<PaginatedResponse<OrderListItem>>('/seller/orders', { params }),

  getById: (id: number) =>
    api.get<SuccessResponse<SellerOrderDetail>>(`/seller/orders/${id}`),

  updateStatus: (id: number, data: UpdateOrderStatusRequest) =>
    api.patch<SuccessResponse<SellerOrderDetail>>(`/seller/orders/${id}/status`, data),

  updatePaymentStatus: (id: number, data: UpdatePaymentStatusRequest) =>
    api.patch<SuccessResponse<SellerOrderDetail>>(`/seller/orders/${id}/payment-status`, data),
};
