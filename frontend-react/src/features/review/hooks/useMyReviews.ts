import { useQuery } from '@tanstack/react-query';
import { reviewService } from '../services/review.service';
import { reviewKeys } from './useProductReviews';
import type { MyReviewListParams } from '../types/review.types';

export function useMyReviews(params: MyReviewListParams) {
  return useQuery({
    queryKey: reviewKeys.my(params),
    queryFn: () => reviewService.getMyReviews(params),
    staleTime: 60 * 1000,
    select: (res) => ({
      data: res.data.data,
      meta: res.data.meta,
    }),
  });
}
