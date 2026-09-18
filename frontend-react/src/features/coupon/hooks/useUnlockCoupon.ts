import { useMutation, useQueryClient } from '@tanstack/react-query';
import { adminCouponService } from '../services/admin-coupon.service';
import { adminCouponKeys } from './useAdminCoupons';
import { showSuccessToast } from '@/common/components/feedback/toast';
import { useTranslation } from 'react-i18next';

export function useUnlockCoupon() {
  const queryClient = useQueryClient();
  const { t } = useTranslation('toast');

  return useMutation({
    mutationFn: (id: number) => adminCouponService.unlock(id),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminCouponKeys.all });
      showSuccessToast(t('coupon.unlocked'));
    },
  });
}
