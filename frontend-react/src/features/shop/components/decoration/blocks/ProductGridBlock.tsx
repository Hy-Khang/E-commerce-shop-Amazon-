import { useTranslation } from 'react-i18next';
import { ProductCard, ProductCardSkeleton } from '@/features/product';
import type { ProductGridBlockData } from '../../../types/decoration.types';
import { useProductsByIds } from '../../../hooks/useProductsByIds';
import { SAMPLE_PRODUCTS } from '../../../utils/decoration-preview-samples';

interface Props {
  data: ProductGridBlockData;
  /** Builder preview only — shows sample products when no pins resolve. */
  preview?: boolean;
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
export function ProductGridBlock({ data, preview }: Props) {
  const { t } = useTranslation('shop');
  const { data: products, isLoading } = useProductsByIds(data.product_ids);
  const gridClass = COLUMNS_CLASS[data.columns ?? 4];
  const previewSample =
    preview && !isLoading && (!products || products.length === 0)
      ? SAMPLE_PRODUCTS.slice(0, Math.max(data.product_ids.length, 4))
      : null;

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
      ) : previewSample ? (
        <div className={`grid gap-4 ${gridClass}`}>
          {previewSample.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border-default py-10 text-center text-sm text-text-secondary">
          {t('productGrid.emptyState')}
        </div>
      )}
    </section>
  );
}
