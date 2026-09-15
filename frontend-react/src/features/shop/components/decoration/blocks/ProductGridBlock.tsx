import { ProductCard, ProductCardSkeleton } from '@/features/product';
import type { ProductGridBlockData } from '../../../types/decoration.types';
import { useProductsByIds } from '../../../hooks/useProductsByIds';

interface Props {
  data: ProductGridBlockData;
}

const COLUMNS_CLASS: Record<NonNullable<ProductGridBlockData['columns']>, string> = {
  2: 'grid-cols-2',
  3: 'grid-cols-2 sm:grid-cols-3',
  4: 'grid-cols-2 sm:grid-cols-3 xl:grid-cols-4',
};

/**
 * A curated grid of pinned products, hydrated fresh via the public catalog
 * (visibility-filtered). Hidden/inactive pins silently drop out; if none remain
 * (e.g. the shop is not yet active) it shows a small empty state.
 */
export function ProductGridBlock({ data }: Props) {
  const { data: products, isLoading } = useProductsByIds(data.product_ids);
  const gridClass = COLUMNS_CLASS[data.columns ?? 4];

  return (
    <section>
      {data.title && (
        <h2 className="mb-6 text-xl font-bold tracking-tight text-text-primary">
          {data.title}
        </h2>
      )}

      {isLoading ? (
        <div className={`grid gap-4 ${gridClass}`}>
          {Array.from({ length: data.product_ids.length }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      ) : products && products.length > 0 ? (
        <div className={`grid gap-4 ${gridClass}`}>
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border-default py-10 text-center text-sm text-text-secondary">
          These products will appear once they are available.
        </div>
      )}
    </section>
  );
}
