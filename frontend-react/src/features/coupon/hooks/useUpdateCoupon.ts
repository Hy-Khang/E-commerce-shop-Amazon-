import { useMutation, useQueryClient } from '@tanstack/react-query';
import { adminCouponService } from '../services/admin-coupon.service';
import { adminCouponKeys } from './useAdminCoupons';
import type { UpdateCouponRequest } from '../types/coupon.types';

export function useUpdateCoupon(id: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateCouponRequest) =>
      adminCouponService.update(id, data).then((res) => res.data.data),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminCouponKeys.all });
      queryClient.invalidateQueries({ queryKey: adminCouponKeys.detail(id) });
    },
  });
}
