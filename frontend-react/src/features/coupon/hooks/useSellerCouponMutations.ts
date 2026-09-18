import { useMutation, useQueryClient } from '@tanstack/react-query';
import { sellerCouponService } from '../services/seller-coupon.service';
import { sellerCouponKeys } from './useSellerCoupons';
import { showSuccessToast } from '@/common/components/feedback/toast';
import { useTranslation } from 'react-i18next';
import type {
  CreateSellerCouponRequest,
  UpdateSellerCouponRequest,
} from '../types/coupon.types';

export function useCreateSellerCoupon() {
  const queryClient = useQueryClient();
  const { t } = useTranslation('toast');

  return useMutation({
    mutationFn: (data: CreateSellerCouponRequest) =>
      sellerCouponService.create(data).then((res) => res.data.data),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sellerCouponKeys.all });
      showSuccessToast(t('coupon.created'));
    },
  });
}

export function useUpdateSellerCoupon(id: number) {
  const queryClient = useQueryClient();
  const { t } = useTranslation('toast');

  return useMutation({
    mutationFn: (data: UpdateSellerCouponRequest) =>
      sellerCouponService.update(id, data).then((res) => res.data.data),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sellerCouponKeys.all });
      queryClient.invalidateQueries({ queryKey: sellerCouponKeys.detail(id) });
      showSuccessToast(t('coupon.updated'));
    },
  });
}

export function useDeactivateSellerCoupon() {
  const queryClient = useQueryClient();
  const { t } = useTranslation('toast');

  return useMutation({
    mutationFn: (id: number) => sellerCouponService.deactivate(id),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sellerCouponKeys.all });
      showSuccessToast(t('coupon.deactivated'));
    },
  });
}

/**
 * Re-enable a previously-deactivated shop coupon (e.g. after an admin cleared
 * their moderation lock, which no longer auto-reactivates). Admin-locked
 * coupons are rejected server-side (COUPON_013).
 */
export function useReactivateSellerCoupon() {
  const queryClient = useQueryClient();
  const { t } = useTranslation('toast');

  return useMutation({
    mutationFn: (id: number) =>
      sellerCouponService.update(id, { is_active: true }),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sellerCouponKeys.all });
      showSuccessToast(t('coupon.reactivated'));
    },
  });
}
