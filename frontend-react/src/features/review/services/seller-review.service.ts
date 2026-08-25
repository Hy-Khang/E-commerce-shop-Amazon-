import { api } from '@/core/api/axios-instance';
import type { PaginatedResponse } from '@/core/api/api.types';
import type { Review, SellerReviewListParams } from '../types/review.types';

export const sellerReviewService = {
  getList: (params: SellerReviewListParams) =>
    api.get<PaginatedResponse<Review>>('/seller/reviews', { params }),
};
