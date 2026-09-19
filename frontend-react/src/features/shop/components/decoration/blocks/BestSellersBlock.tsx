import { useTranslation } from 'react-i18next';
import { ProductCard, ProductCardSkeleton } from '@/features/product';
import type { BestSellersBlockData } from '../../../types/decoration.types';
import { useShopBestSellers } from '../../../hooks/useShopBestSellers';
import { SAMPLE_PRODUCTS } from '../../../utils/decoration-preview-samples';

interface Props {
  data: BestSellersBlockData;
  /** The shop whose top sellers to show; supplied by the renderer context. */
  shopId?: number;
  /** Builder preview only — shows sample data when the shop has no sales yet. */
  preview?: boolean;
}

const COLUMNS_CLASS: Record<NonNullable<BestSellersBlockData['columns']>, string> = {
  2: 'grid-cols-2',
  3: 'grid-cols-2 sm:grid-cols-3',
  4: 'grid-cols-2 sm:grid-cols-3 xl:grid-cols-4',
};

/**
 * An auto-populated grid of the shop's best-selling products — no manual pinning.
 * Hydrated fresh via the public catalog (`shop_id` + `sort=best_selling`,
 * visibility-filtered). A shop with no sales shows a small empty state (or, in
 * the builder preview, sample products so the seller can still visualize it).
 */
export function BestSellersBlock({ data, shopId, preview }: Props) {
  const { t } = useTranslation('shop');
  const limit = data.limit ?? 4;
  const gridClass = COLUMNS_CLASS[data.columns ?? 4];
  const { data: products, isLoading } = useShopBestSellers(shopId, limit);

  return (
    <section>
      {data.title && (
        <h2 className="mb-6 text-xl font-bold tracking-tight text-text-primary">{data.title}</h2>
      )}

      {isLoading ? (
        <div className={`grid gap-4 ${gridClass}`}>
          {Array.from({ length: limit }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      ) : products && products.length > 0 ? (
        <div className={`grid gap-4 ${gridClass}`}>
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : preview ? (
        // Builder preview: the shop has no sales yet — show sample products so
        // the seller can still visualize the block (never shown to shoppers).
        <div className={`grid gap-4 ${gridClass}`}>
          {SAMPLE_PRODUCTS.slice(0, limit).map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border-default py-10 text-center text-sm text-text-secondary">
          {t('bestSellers.emptyState')}
        </div>
      )}
    </section>
  );
}
