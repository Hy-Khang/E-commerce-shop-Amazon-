import { useFrequentlyBoughtTogether } from '../hooks/useFrequentlyBoughtTogether';
import { RecommendationCarousel } from './RecommendationCarousel';

interface Props {
  productId: number;
}

/** "Frequently Bought Together" — co-purchase, falls back to similar. */
export function FrequentlyBoughtTogetherCarousel({ productId }: Props) {
  const { products, isLoading } = useFrequentlyBoughtTogether(productId);

  return (
    <RecommendationCarousel
      title="Frequently Bought Together"
      products={products}
      isLoading={isLoading}
    />
  );
}
