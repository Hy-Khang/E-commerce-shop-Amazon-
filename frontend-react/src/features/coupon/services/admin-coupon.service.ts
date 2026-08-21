import { api } from '@/core/api/axios-instance';
import type { SuccessResponse, PaginatedResponse } from '@/core/api/api.types';
import type {
  Coupon,
  CouponUsage,
  CouponListParams,
  CouponUsageListParams,
  CreateCouponRequest,
  UpdateCouponRequest,
} from '../types/coupon.types';

export const adminCouponService = {
  getList: (params: CouponListParams) =>
    api.get<PaginatedResponse<Coupon>>('/admin/coupons', { params }),

  getById: (id: number) =>
    api.get<SuccessResponse<Coupon>>(`/admin/coupons/${id}`),

  create: (data: CreateCouponRequest) =>
    api.post<SuccessResponse<Coupon>>('/admin/coupons', data),

  update: (id: number, data: UpdateCouponRequest) =>
    api.patch<SuccessResponse<Coupon>>(`/admin/coupons/${id}`, data),

  deactivate: (id: number) =>
    api.delete(`/admin/coupons/${id}`),

  unlock: (id: number) =>
    api.patch<SuccessResponse<Coupon>>(`/admin/coupons/${id}/unlock`),

  getUsages: (params: CouponUsageListParams) =>
    api.get<PaginatedResponse<CouponUsage>>('/admin/coupons/usages', { params }),

  getCouponUsages: (id: number, params: CouponUsageListParams) =>
    api.get<PaginatedResponse<CouponUsage>>(`/admin/coupons/${id}/usages`, { params }),
};
