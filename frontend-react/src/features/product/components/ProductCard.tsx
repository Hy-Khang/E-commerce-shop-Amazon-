import { Link } from 'react-router-dom';
import { Zap } from 'lucide-react';
import { ROUTES } from '@/common/constants/routes';
import { formatPrice, getImageUrl } from '@/common/utils/format.util';
import { WishlistButton } from '@/features/wishlist';
import { CompareToggleButton } from '@/features/compare';
import { useFlashPriceMaps } from '@/features/flash-sale';
import { usePrefetchProduct } from '../hooks/usePrefetchProduct';
import { getPriceRange, hasAnyStock } from '../utils/product.util';
import type { ProductListItem } from '../types/product.types';

interface Props {
  product: ProductListItem;
  /** Denser layout for tight contexts (e.g. AI chat suggestions) — smaller
   *  padding + type so the thumbnail reads compact. Default keeps the full card. */
  compact?: boolean;
  /** Extra classes on the card root — e.g. `h-full` to stretch to an
   *  equal-height grid cell so sibling actions line up across a row. */
  className?: string;
}

export function ProductCard({ product, compact = false, className = '' }: Props) {
  const prefetch = usePrefetchProduct();
  const { byProduct } = useFlashPriceMaps();
  const priceRange = getPriceRange(product.variants);
  const inStock = hasAnyStock(product.variants);
  const flash = byProduct.get(product.id) ?? null;
  const priceSize = compact ? 'text-xs' : 'text-sm';

  return (
    <Link
      to={ROUTES.PRODUCT_DETAIL(product.slug)}
      onMouseEnter={() => prefetch(product.slug)}
      className={`group block overflow-hidden rounded-xl border border-border-default bg-elevated transition-all hover:border-border-strong hover:shadow-sm ${className}`}
    >
      <div className="relative aspect-square overflow-hidden bg-surface-hover">
        {product.thumbnail_url ? (
          <img
            src={getImageUrl(product.thumbnail_url)}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-text-muted">
            No image
          </div>
        )}
        <div className="absolute right-2 top-2 flex flex-col gap-1.5">
          <WishlistButton productId={product.id} size="sm" />
          <CompareToggleButton product={product} />
        </div>
        {flash && (
          <span className="absolute left-2 top-2 inline-flex items-center gap-0.5 rounded-full bg-amber-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm">
            <Zap className="h-2.5 w-2.5 fill-current" />
            Flash
          </span>
        )}
      </div>
      <div className={compact ? 'p-2' : 'p-4'}>
        <h3
          className={`truncate font-semibold text-text-primary group-hover:text-text-brand transition-colors ${
            compact ? 'text-xs' : 'text-sm'
          }`}
        >
          {product.name}
        </h3>
        <div className="mt-1">
          {flash ? (
            <div className="flex flex-wrap items-baseline gap-x-2">
              <span className={`${priceSize} font-bold text-amber-600 dark:text-amber-400`}>
                {formatPrice(flash.flash_price)}
              </span>
              {flash.original_price != null && flash.original_price > flash.flash_price && (
                <span className="text-xs text-text-muted line-through">
                  {formatPrice(flash.original_price)}
                </span>
              )}
            </div>
          ) : priceRange ? (
            priceRange.min === priceRange.max ? (
              <span className={`${priceSize} font-bold text-text-price`}>
                {formatPrice(priceRange.min)}
              </span>
            ) : (
              <span className={`${priceSize} font-bold text-text-price`}>
                {formatPrice(priceRange.min)} — {formatPrice(priceRange.max)}
              </span>
            )
          ) : (
            <span className={`${priceSize} text-text-muted`}>No variants</span>
          )}
        </div>
        {!inStock && (
          <span className="mt-1 inline-block text-xs font-medium text-error-600">Out of stock</span>
        )}
      </div>
    </Link>
  );
}
