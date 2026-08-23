import { useQuery } from '@tanstack/react-query';
import { sellerReviewService } from '../services/seller-review.service';
import type { SellerReviewListParams } from '../types/review.types';

export const sellerReviewKeys = {
  all: ['seller', 'reviews'] as const,
  list: (params: SellerReviewListParams) => ['seller', 'reviews', 'list', params] as const,
};

export function useSellerReviews(params: SellerReviewListParams) {
  return useQuery({
    queryKey: sellerReviewKeys.list(params),
    queryFn: () => sellerReviewService.getList(params),
    select: (res) => ({
      data: res.data.data,
      meta: res.data.meta,
    }),
  });
}
