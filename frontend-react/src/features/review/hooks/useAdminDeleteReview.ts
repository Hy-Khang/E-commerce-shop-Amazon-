import { useMutation, useQueryClient } from '@tanstack/react-query';
import { adminReviewService } from '../services/admin-review.service';
import { adminReviewKeys } from './useAdminReviews';

export function useAdminDeleteReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => adminReviewService.delete(id),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminReviewKeys.all });
    },
  });
}
