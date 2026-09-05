import { useQuery } from '@tanstack/react-query';
import { recommendationsService } from '../services/recommendations.service';

export const recommendationKeys = {
  all: ['recommendations'] as const,
  forYou: (limit: number) => ['recommendations', 'for-you', limit] as const,
  similar: (productId: number, limit: number) =>
    ['recommendations', 'similar', productId, limit] as const,
  fbt: (productId: number, limit: number) =>
    ['recommendations', 'fbt', productId, limit] as const,
};

/** "Recommended for You" — personalized products + a reason label. */
export function useRecommendedForYou(limit = 12) {
  const query = useQuery({
    queryKey: recommendationKeys.forYou(limit),
    queryFn: () =>
      recommendationsService.getRecommendations(limit).then((r) => r.data.data),
    staleTime: 60 * 1000,
  });

  return {
    products: query.data?.products ?? [],
    reason: query.data?.reason ?? null,
    isLoading: query.isLoading,
  };
}
