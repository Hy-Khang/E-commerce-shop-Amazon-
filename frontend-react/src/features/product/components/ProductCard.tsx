import { Link } from 'react-router-dom';
import { Zap, Sparkles } from 'lucide-react';
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
  /**
   * `recommended` marks a card in the personalized "Recommended for You" rail:
   * a subtle brand ring + a "For You" chip. Opt-in so only that rail carries it
   * (the single top-level reason names the set, not each product — so the chip
   * is a set-level cue, not a per-item explanation). Default = plain card.
   */
  variant?: 'default' | 'recommended';
  /** Extra classes on the card root — e.g. `h-full` to stretch to an
   *  equal-height grid cell so sibling actions line up across a row. */
  className?: string;
}

export function ProductCard({
  product,
  compact = false,
  variant = 'default',
  className = '',
}: Props) {
  const prefetch = usePrefetchProduct();
  const { byProduct } = useFlashPriceMaps();
  const priceRange = getPriceRange(product.variants);
  const inStock = hasAnyStock(product.variants);
  const flash = byProduct.get(product.id) ?? null;
  const priceSize = compact ? 'text-xs' : 'text-sm';
  const isRecommended = variant === 'recommended';

  return (
    <Link
      to={ROUTES.PRODUCT_DETAIL(product.slug)}
      onMouseEnter={() => prefetch(product.slug)}
      className={`group flex h-full flex-col overflow-hidden rounded-xl border bg-elevated transition-all hover:shadow-sm ${
        isRecommended
          ? 'border-border-brand/40 ring-1 ring-border-brand/20 hover:border-border-brand'
          : 'border-border-default hover:border-border-strong'
      } ${className}`}
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
        <div className="absolute left-2 top-2 flex flex-col items-start gap-1.5">
          {flash && (
            <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm">
              <Zap className="h-2.5 w-2.5 fill-current" />
              Flash
            </span>
          )}
          {isRecommended && (
            <span className="inline-flex items-center gap-0.5 rounded-full bg-brand px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-text-inverse shadow-sm">
              <Sparkles className="h-2.5 w-2.5" />
              For You
            </span>
          )}
        </div>
      </div>
      <div className={`flex flex-1 flex-col ${compact ? 'p-2' : 'p-4'}`}>
        <h3
          className={`truncate font-semibold text-text-primary group-hover:text-text-brand transition-colors ${
            compact ? 'text-xs' : 'text-sm'
          }`}
        >
          {product.name}
        </h3>
        <div className="mt-auto pt-1">
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
