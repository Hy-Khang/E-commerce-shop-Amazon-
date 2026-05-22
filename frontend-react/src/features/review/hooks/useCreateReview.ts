import { useMutation, useQueryClient } from '@tanstack/react-query';
import { reviewService } from '../services/review.service';
import { reviewKeys } from './useProductReviews';
import type { CreateReviewRequest } from '../types/review.types';

export function useCreateReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateReviewRequest) =>
      reviewService.create(data).then((res) => res.data.data),

    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['reviews', 'product', variables.product_id],
      });
      queryClient.invalidateQueries({ queryKey: reviewKeys.all });
    },
  });
}
