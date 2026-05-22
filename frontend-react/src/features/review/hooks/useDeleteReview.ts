import { useMutation, useQueryClient } from '@tanstack/react-query';
import { reviewService } from '../services/review.service';
import { reviewKeys } from './useProductReviews';

export function useDeleteReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => reviewService.delete(id),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reviewKeys.all });
    },
  });
}
