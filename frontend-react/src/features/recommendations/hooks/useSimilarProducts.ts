import { useQuery } from '@tanstack/react-query';
import { recommendationsService } from '../services/recommendations.service';
import { recommendationKeys } from './useRecommendedForYou';

/** "Similar Products" for a product (content similarity blended with co-view). */
export function useSimilarProducts(productId: number | undefined, limit = 12) {
  const query = useQuery({
    queryKey: recommendationKeys.similar(productId ?? 0, limit),
    queryFn: () =>
      recommendationsService
        .getSimilar(productId as number, limit)
        .then((r) => r.data.data.products),
    enabled: !!productId,
    staleTime: 5 * 60 * 1000,
  });

  return { products: query.data ?? [], isLoading: query.isLoading };
}
