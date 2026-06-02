import { useQuery } from '@tanstack/react-query';
import { adminCouponService } from '../services/admin-coupon.service';
import { adminCouponKeys } from './useAdminCoupons';

export function useAdminCoupon(id: number) {
  return useQuery({
    queryKey: adminCouponKeys.detail(id),
    queryFn: () => adminCouponService.getById(id),
    select: (res) => res.data.data,
    enabled: id > 0,
  });
}
