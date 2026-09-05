import { Link } from 'react-router-dom';
import { ROUTES } from '@/common/constants/routes';
import { formatPrice, getImageUrl } from '@/common/utils/format.util';
import type { FlashSaleItem } from '../types/flash-sale.types';

interface Props {
  item: FlashSaleItem;
}

/** A single flash-sale deal card: flash price, struck original, sold progress. */
export function FlashSaleCard({ item }: Props) {
  const original = item.original_price ?? null;
  const discountPercent =
    original && original > item.flash_price
      ? Math.round(((original - item.flash_price) / original) * 100)
      : 0;
  const soldOut = item.sold_quantity >= item.flash_quantity;

  const content = (
    <div className="group flex h-full flex-col overflow-hidden rounded-xl border border-border-default bg-elevated shadow-sm transition-colors hover:border-border-strong">
      <div className="relative aspect-square overflow-hidden bg-neutral-50">
        {item.thumbnail_url ? (
          <img
            src={getImageUrl(item.thumbnail_url)}
            alt={item.product_name ?? ''}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-text-muted">
            No image
          </div>
        )}
        {discountPercent > 0 && (
          <span className="absolute left-2 top-2 rounded-full bg-amber-600 px-2 py-0.5 text-xs font-bold text-white">
            -{discountPercent}%
          </span>
        )}
        {soldOut && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-neutral-800">
              Sold out
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-3">
        <h3 className="line-clamp-2 text-sm font-semibold text-text-primary">
          {item.product_name ?? item.sku}
        </h3>

        <div className="flex items-baseline gap-2">
          <span className="text-sm font-bold text-amber-600 dark:text-amber-400">
            {formatPrice(item.flash_price)}
          </span>
          {original && original > item.flash_price && (
            <span className="text-xs text-text-muted line-through">
              {formatPrice(original)}
            </span>
          )}
        </div>

        <div className="mt-auto pt-1">
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-amber-100 dark:bg-amber-500/20">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all"
              style={{ width: `${Math.max(item.sold_percent, 4)}%` }}
            />
          </div>
          <p className="mt-1 text-[11px] font-medium text-text-secondary">
            Sold {item.sold_quantity}/{item.flash_quantity}
          </p>
        </div>
      </div>
    </div>
  );

  // Link to the product detail when we know the slug; otherwise render inert.
  return item.product_slug ? (
    <Link to={ROUTES.PRODUCT_DETAIL(item.product_slug)} className="block h-full">
      {content}
    </Link>
  ) : (
    content
  );
}
