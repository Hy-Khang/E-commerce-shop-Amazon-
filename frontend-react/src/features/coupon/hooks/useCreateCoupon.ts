import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { adminCouponService } from '../services/admin-coupon.service';
import { adminCouponKeys } from './useAdminCoupons';
import { ROUTES } from '@/common/constants/routes';
import type { CreateCouponRequest } from '../types/coupon.types';

export function useCreateCoupon() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (data: CreateCouponRequest) =>
      adminCouponService.create(data).then((res) => res.data.data),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminCouponKeys.all });
      navigate(ROUTES.ADMIN_COUPONS);
    },
  });
}
