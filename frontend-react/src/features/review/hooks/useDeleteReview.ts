import { useMutation, useQueryClient } from '@tanstack/react-query';
import { reviewService } from '../services/review.service';
import { reviewKeys } from './useProductReviews';
import { showSuccessToast } from '@/common/components/feedback/toast';
import { useTranslation } from 'react-i18next';

export function useDeleteReview() {
  const queryClient = useQueryClient();
  const { t } = useTranslation('toast');

  return useMutation({
    mutationFn: (id: number) => reviewService.delete(id),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reviewKeys.all });
      showSuccessToast(t('review.deleted'));
    },
  });
}
