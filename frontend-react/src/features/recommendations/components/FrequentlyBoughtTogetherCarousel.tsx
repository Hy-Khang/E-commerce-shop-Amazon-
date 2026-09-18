import { useTranslation } from 'react-i18next';
import { useFrequentlyBoughtTogether } from '../hooks/useFrequentlyBoughtTogether';
import { RecommendationCarousel } from './RecommendationCarousel';

interface Props {
  productId: number;
}

/** "Frequently Bought Together" — co-purchase, falls back to similar. */
export function FrequentlyBoughtTogetherCarousel({ productId }: Props) {
  const { t } = useTranslation('recommendations');
  const { products, isLoading } = useFrequentlyBoughtTogether(productId);

  return (
    <RecommendationCarousel
      title={t('frequentlyBoughtTogether')}
      products={products}
      isLoading={isLoading}
    />
  );
}
