import { useMutation, useQueryClient } from '@tanstack/react-query';
import { adminReviewService } from '../services/admin-review.service';
import { adminReviewKeys } from './useAdminReviews';
import { showSuccessToast } from '@/common/components/feedback/toast';
import { useTranslation } from 'react-i18next';

export function useAdminDeleteReview() {
  const queryClient = useQueryClient();
  const { t } = useTranslation('toast');

  return useMutation({
    mutationFn: (id: number) => adminReviewService.delete(id),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminReviewKeys.all });
      showSuccessToast(t('review.deleted'));
    },
  });
}
