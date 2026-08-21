import { useMutation, useQueryClient } from '@tanstack/react-query';
import { adminCouponService } from '../services/admin-coupon.service';
import { adminCouponKeys } from './useAdminCoupons';
import { showSuccessToast } from '@/common/components/feedback/toast';
import { useTranslation } from '@/common/i18n';

export function useUnlockCoupon() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (id: number) => adminCouponService.unlock(id),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminCouponKeys.all });
      showSuccessToast(t((m) => m.toast.coupon.unlocked));
    },
  });
}
