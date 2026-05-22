import { useQuery } from '@tanstack/react-query';
import { reviewService } from '../services/review.service';
import type { ProductReviewListParams } from '../types/review.types';

export const reviewKeys = {
  all: ['reviews'] as const,
  product: (productId: number, params: ProductReviewListParams) =>
    ['reviews', 'product', productId, params] as const,
  my: (params: ProductReviewListParams) => ['reviews', 'me', params] as const,
};

export function useProductReviews(productId: number, params: ProductReviewListParams) {
  return useQuery({
    queryKey: reviewKeys.product(productId, params),
    queryFn: () => reviewService.getProductReviews(productId, params),
    staleTime: 60 * 1000,
    enabled: productId > 0,
    select: (res) => ({
      data: res.data.data,
      meta: res.data.meta,
      stats: res.data.stats,
    }),
  });
}
