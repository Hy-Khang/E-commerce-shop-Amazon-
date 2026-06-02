import { useMutation, useQueryClient } from '@tanstack/react-query';
import { adminReviewService } from '../services/admin-review.service';
import { adminReviewKeys } from './useAdminReviews';
import { showSuccessToast } from '@/common/components/feedback/toast';
import { useTranslation } from '@/common/i18n';

export function useAdminDeleteReview() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (id: number) => adminReviewService.delete(id),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminReviewKeys.all });
      showSuccessToast(t((m) => m.toast.review.deleted));
    },
  });
}
