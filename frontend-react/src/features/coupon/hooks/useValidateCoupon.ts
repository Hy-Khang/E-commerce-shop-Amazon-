import { useMutation } from '@tanstack/react-query';
import { couponService } from '../services/coupon.service';

export function useValidateCoupon() {
  return useMutation({
    mutationFn: (code: string) =>
      couponService.validate({ code }).then((res) => res.data.data),
  });
}
