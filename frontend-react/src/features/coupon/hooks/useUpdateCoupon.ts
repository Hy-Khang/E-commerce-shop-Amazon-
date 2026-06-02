import { useMutation, useQueryClient } from '@tanstack/react-query';
import { adminCouponService } from '../services/admin-coupon.service';
import { adminCouponKeys } from './useAdminCoupons';
import { showSuccessToast } from '@/common/components/feedback/toast';
import { useTranslation } from '@/common/i18n';
import type { UpdateCouponRequest } from '../types/coupon.types';

export function useUpdateCoupon(id: number) {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (data: UpdateCouponRequest) =>
      adminCouponService.update(id, data).then((res) => res.data.data),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminCouponKeys.all });
      queryClient.invalidateQueries({ queryKey: adminCouponKeys.detail(id) });
      showSuccessToast(t((m) => m.toast.coupon.updated));
    },
  });
}
