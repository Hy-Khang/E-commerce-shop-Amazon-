import { useQuery } from '@tanstack/react-query';
import { adminReviewService } from '../services/admin-review.service';
import type { AdminReviewListParams } from '../types/review.types';

export const adminReviewKeys = {
  all: ['admin', 'reviews'] as const,
  list: (params: AdminReviewListParams) => ['admin', 'reviews', 'list', params] as const,
};

export function useAdminReviews(params: AdminReviewListParams) {
  return useQuery({
    queryKey: adminReviewKeys.list(params),
    queryFn: () => adminReviewService.getList(params),
    select: (res) => ({
      data: res.data.data,
      meta: res.data.meta,
    }),
  });
}
