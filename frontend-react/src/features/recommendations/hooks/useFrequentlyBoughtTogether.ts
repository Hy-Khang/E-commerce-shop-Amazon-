import { useQuery } from '@tanstack/react-query';
import { recommendationsService } from '../services/recommendations.service';
import { recommendationKeys } from './useRecommendedForYou';

/** "Frequently Bought Together" for a product (co-purchase, falls back to similar). */
export function useFrequentlyBoughtTogether(
  productId: number | undefined,
  limit = 12,
) {
  const query = useQuery({
    queryKey: recommendationKeys.fbt(productId ?? 0, limit),
    queryFn: () =>
      recommendationsService
        .getFrequentlyBoughtTogether(productId as number, limit)
        .then((r) => r.data.data.products),
    enabled: !!productId,
    staleTime: 5 * 60 * 1000,
  });

  return { products: query.data ?? [], isLoading: query.isLoading };
}
