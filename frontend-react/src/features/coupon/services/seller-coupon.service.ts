import { api } from '@/core/api/axios-instance';
import type { SuccessResponse, PaginatedResponse } from '@/core/api/api.types';
import type {
  Coupon,
  CouponUsage,
  CouponListParams,
  CouponUsageListParams,
  CreateSellerCouponRequest,
  UpdateSellerCouponRequest,
} from '../types/coupon.types';

export const sellerCouponService = {
  getList: (params: CouponListParams) =>
    api.get<PaginatedResponse<Coupon>>('/seller/coupons', { params }),

  getById: (id: number) =>
    api.get<SuccessResponse<Coupon>>(`/seller/coupons/${id}`),

  create: (data: CreateSellerCouponRequest) =>
    api.post<SuccessResponse<Coupon>>('/seller/coupons', data),

  update: (id: number, data: UpdateSellerCouponRequest) =>
    api.patch<SuccessResponse<Coupon>>(`/seller/coupons/${id}`, data),

  deactivate: (id: number) => api.delete(`/seller/coupons/${id}`),

  getCouponUsages: (id: number, params: CouponUsageListParams) =>
    api.get<PaginatedResponse<CouponUsage>>(`/seller/coupons/${id}/usages`, {
      params,
    }),
};
