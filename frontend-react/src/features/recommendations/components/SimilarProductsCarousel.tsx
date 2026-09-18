import { useTranslation } from 'react-i18next';
import { useSimilarProducts } from '../hooks/useSimilarProducts';
import { RecommendationCarousel } from './RecommendationCarousel';

interface Props {
  productId: number;
}

/** "Similar Products" — content similarity blended with co-view behavior. */
export function SimilarProductsCarousel({ productId }: Props) {
  const { t } = useTranslation('recommendations');
  const { products, isLoading } = useSimilarProducts(productId);

  return (
    <RecommendationCarousel
      title={t('similarProducts')}
      products={products}
      isLoading={isLoading}
    />
  );
}
