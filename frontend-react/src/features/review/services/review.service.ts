import { api } from '@/core/api/axios-instance';
import type { SuccessResponse, PaginatedResponse } from '@/core/api/api.types';
import type {
  Review,
  ReviewStats,
  CreateReviewRequest,
  ProductReviewListParams,
  MyReviewListParams,
} from '../types/review.types';

type ProductReviewsResponse = PaginatedResponse<Review> & { stats: ReviewStats };

export const reviewService = {
  create: (data: CreateReviewRequest) =>
    api.post<SuccessResponse<Review>>('/reviews', data),

  getProductReviews: (productId: number, params: ProductReviewListParams) =>
    api.get<ProductReviewsResponse>(`/products/${productId}/reviews`, { params }),

  getMyReviews: (params: MyReviewListParams) =>
    api.get<PaginatedResponse<Review>>('/reviews/me', { params }),

  delete: (id: number) =>
    api.delete(`/reviews/${id}`),
};
