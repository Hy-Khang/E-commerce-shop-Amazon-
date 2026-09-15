import { useSimilarProducts } from '../hooks/useSimilarProducts';
import { RecommendationCarousel } from './RecommendationCarousel';

interface Props {
  productId: number;
}

/** "Similar Products" — content similarity blended with co-view behavior. */
export function SimilarProductsCarousel({ productId }: Props) {
  const { products, isLoading } = useSimilarProducts(productId);

  return (
    <RecommendationCarousel
      title="Similar Products"
      products={products}
      isLoading={isLoading}
    />
  );
}
