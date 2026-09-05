import { useRecommendedForYou } from '../hooks/useRecommendedForYou';
import { RecommendationCarousel } from './RecommendationCarousel';

/** "Recommended for You" — personalized carousel with a reason subtitle. */
export function RecommendedForYouCarousel() {
  const { products, reason, isLoading } = useRecommendedForYou();

  return (
    <RecommendationCarousel
      title="Recommended for You"
      subtitle={reason}
      products={products}
      isLoading={isLoading}
    />
  );
}
