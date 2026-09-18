import { useTranslation } from 'react-i18next';
import { useRecommendedForYou } from '../hooks/useRecommendedForYou';
import { RecommendationCarousel } from './RecommendationCarousel';

/** "Recommended for You" — personalized carousel with a reason subtitle. */
export function RecommendedForYouCarousel() {
  const { t } = useTranslation('recommendations');
  const { products, reason, isLoading } = useRecommendedForYou();

  return (
    <RecommendationCarousel
      title={t('recommendedForYou')}
      subtitle={reason}
      products={products}
      isLoading={isLoading}
      accent
    />
  );
}
