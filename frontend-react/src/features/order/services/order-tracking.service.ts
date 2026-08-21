import { api } from '@/core/api/axios-instance';
import type { SuccessResponse } from '@/core/api/api.types';
import type { OrderTrackingResponse, UpdateShipperLocationRequest } from '../types/order-tracking.types';

export const orderTrackingService = {
  getCustomerTracking: (orderId: number) =>
    api.get<SuccessResponse<OrderTrackingResponse>>(`/orders/${orderId}/tracking`),

  getAdminTracking: (orderId: number) =>
    api.get<SuccessResponse<OrderTrackingResponse>>(`/admin/orders/${orderId}/tracking`),

  getSellerTracking: (orderId: number) =>
    api.get<SuccessResponse<OrderTrackingResponse>>(`/seller/orders/${orderId}/tracking`),

  getShipperTracking: (orderId: number) =>
    api.get<SuccessResponse<OrderTrackingResponse>>(`/shipper/orders/${orderId}/tracking`),

  updateShipperLocation: (orderId: number, data: UpdateShipperLocationRequest) =>
    api.patch(`/shipper/orders/${orderId}/location`, data),
};
