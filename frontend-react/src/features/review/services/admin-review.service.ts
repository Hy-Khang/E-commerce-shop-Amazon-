import { api } from '@/core/api/axios-instance';
import type { PaginatedResponse } from '@/core/api/api.types';
import type { Review, AdminReviewListParams } from '../types/review.types';

export const adminReviewService = {
  getList: (params: AdminReviewListParams) =>
    api.get<PaginatedResponse<Review>>('/admin/reviews', { params }),

  delete: (id: number) =>
    api.delete(`/admin/reviews/${id}`),
};
