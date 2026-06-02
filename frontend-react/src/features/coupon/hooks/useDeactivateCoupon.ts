import { useMutation, useQueryClient } from '@tanstack/react-query';
import { adminCouponService } from '../services/admin-coupon.service';
import { adminCouponKeys } from './useAdminCoupons';

export function useDeactivateCoupon() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => adminCouponService.deactivate(id),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminCouponKeys.all });
    },
  });
}
