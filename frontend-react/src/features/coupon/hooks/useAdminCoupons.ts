import { useQuery } from '@tanstack/react-query';
import { adminCouponService } from '../services/admin-coupon.service';
import type { CouponListParams } from '../types/coupon.types';

export const adminCouponKeys = {
  all: ['admin', 'coupons'] as const,
  list: (params: CouponListParams) => ['admin', 'coupons', 'list', params] as const,
  detail: (id: number) => ['admin', 'coupons', 'detail', id] as const,
  usages: (id: number) => ['admin', 'coupons', 'usages', id] as const,
  allUsages: (params: Record<string, unknown>) => ['admin', 'coupons', 'allUsages', params] as const,
};

export function useAdminCoupons(
  params: CouponListParams,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: adminCouponKeys.list(params),
    queryFn: () => adminCouponService.getList(params),
    enabled: options?.enabled,
    select: (res) => ({
      data: res.data.data,
      meta: res.data.meta,
    }),
  });
}
