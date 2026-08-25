import { useQuery } from '@tanstack/react-query';
import { sellerCouponService } from '../services/seller-coupon.service';
import type {
  CouponListParams,
  CouponUsageListParams,
} from '../types/coupon.types';

export const sellerCouponKeys = {
  all: ['seller', 'coupons'] as const,
  list: (params: CouponListParams) =>
    ['seller', 'coupons', 'list', params] as const,
  detail: (id: number) => ['seller', 'coupons', 'detail', id] as const,
  usages: (id: number) => ['seller', 'coupons', 'usages', id] as const,
};

export function useSellerCoupons(
  params: CouponListParams,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: sellerCouponKeys.list(params),
    queryFn: () => sellerCouponService.getList(params),
    enabled: options?.enabled,
    select: (res) => ({
      data: res.data.data,
      meta: res.data.meta,
    }),
  });
}

export function useSellerCoupon(id: number) {
  return useQuery({
    queryKey: sellerCouponKeys.detail(id),
    queryFn: () => sellerCouponService.getById(id),
    select: (res) => res.data.data,
    enabled: id > 0,
  });
}

export function useSellerCouponUsages(
  couponId: number,
  params: CouponUsageListParams,
) {
  return useQuery({
    queryKey: sellerCouponKeys.usages(couponId),
    queryFn: () => sellerCouponService.getCouponUsages(couponId, params),
    select: (res) => ({
      data: res.data.data,
      meta: res.data.meta,
    }),
    enabled: couponId > 0,
  });
}
