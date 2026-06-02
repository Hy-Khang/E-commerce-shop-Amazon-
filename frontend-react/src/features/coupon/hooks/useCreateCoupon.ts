import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { adminCouponService } from '../services/admin-coupon.service';
import { adminCouponKeys } from './useAdminCoupons';
import { ROUTES } from '@/common/constants/routes';
import { showSuccessToast } from '@/common/components/feedback/toast';
import { useTranslation } from '@/common/i18n';
import type { CreateCouponRequest } from '../types/coupon.types';

export function useCreateCoupon() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (data: CreateCouponRequest) =>
      adminCouponService.create(data).then((res) => res.data.data),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminCouponKeys.all });
      showSuccessToast(t((m) => m.toast.coupon.created));
      navigate(ROUTES.ADMIN_COUPONS);
    },
  });
}
