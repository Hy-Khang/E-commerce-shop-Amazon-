import { api } from '@/core/api/axios-instance';
import type { SuccessResponse } from '@/core/api/api.types';
import type { CouponValidationResult, ValidateCouponRequest } from '../types/coupon.types';

export const couponService = {
  validate: (data: ValidateCouponRequest) =>
    api.post<SuccessResponse<CouponValidationResult>>('/coupons/validate', data),
};
