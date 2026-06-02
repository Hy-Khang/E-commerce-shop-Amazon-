import { useQuery } from '@tanstack/react-query';
import { adminCouponService } from '../services/admin-coupon.service';
import { adminCouponKeys } from './useAdminCoupons';
import type { CouponUsageListParams } from '../types/coupon.types';

export function useAdminCouponUsages(couponId: number, params: CouponUsageListParams) {
  return useQuery({
    queryKey: adminCouponKeys.usages(couponId),
    queryFn: () => adminCouponService.getCouponUsages(couponId, params),
    select: (res) => ({
      data: res.data.data,
      meta: res.data.meta,
    }),
    enabled: couponId > 0,
  });
}

export function useAdminAllCouponUsages(params: CouponUsageListParams) {
  return useQuery({
    queryKey: adminCouponKeys.allUsages(params as Record<string, unknown>),
    queryFn: () => adminCouponService.getUsages(params),
    select: (res) => ({
      data: res.data.data,
      meta: res.data.meta,
    }),
  });
}
