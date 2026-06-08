import { useProducts } from '../hooks/useProducts';
import { ProductCard } from './ProductCard';
import { ProductCardSkeleton } from './ProductCardSkeleton';

interface Props {
  categoryId: number;
  currentProductId: number;
}

export function RelatedProducts({ categoryId, currentProductId }: Props) {
  const { data, isLoading } = useProducts({ category_id: categoryId, page: 1, limit: 13, sort: 'created_at', order: 'desc' });

  const products = data?.data.filter((p) => p.id !== currentProductId).slice(0, 12) ?? [];

  if (!isLoading && products.length === 0) return null;

  return (
    <section className="shop-card p-6">
      <h2 className="mb-6 text-lg font-bold tracking-tight text-text-primary">Related Products</h2>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        {isLoading
          ? Array.from({ length: 12 }).map((_, i) => <ProductCardSkeleton key={i} />)
          : products.map((product) => <ProductCard key={product.id} product={product} />)}
      </div>
    </section>
  );
}
