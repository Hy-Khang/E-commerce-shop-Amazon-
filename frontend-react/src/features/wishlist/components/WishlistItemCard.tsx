import { Link } from 'react-router-dom';
import { Heart, Package } from 'lucide-react';
import { formatPrice, formatDate, getImageUrl } from '@/common/utils/format.util';
import { ROUTES } from '@/common/constants/routes';
import type { WishlistItem } from '../types/wishlist.types';

interface Props {
  item: WishlistItem;
  onRemove: (productId: number) => void;
  isRemoving: boolean;
}

export function WishlistItemCard({ item, onRemove, isRemoving }: Props) {
  return (
    <div className={`shop-card p-5 relative overflow-hidden transition-all duration-200 hover:border-border-strong ${!item.product_is_active ? 'opacity-60' : ''}`}>
      <div className="flex gap-4 items-start">
        <Link
          to={ROUTES.PRODUCT_DETAIL(item.product_slug)}
          className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl border border-border-default bg-neutral-50"
        >
          {item.product_thumbnail_url ? (
            <img
              src={getImageUrl(item.product_thumbnail_url)}
              alt={item.product_name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Package className="h-7 w-7 text-text-muted" />
            </div>
          )}
        </Link>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 pt-0.5">
              <Link
                to={ROUTES.PRODUCT_DETAIL(item.product_slug)}
                className="text-sm font-semibold text-text-primary hover:text-text-brand transition-colors block leading-tight"
              >
                {item.product_name}
              </Link>

              {!item.product_is_active && (
                <span className="mt-1.5 inline-flex items-center rounded bg-neutral-100 px-1.5 py-0.5 text-[10px] font-bold text-text-muted uppercase tracking-wider">
                  Unavailable
                </span>
              )}

              <div className="mt-2 flex items-baseline gap-2">
                {item.min_sale_price != null ? (
                  <>
                    <span className="text-sm font-bold text-text-price">
                      {formatPrice(item.min_sale_price)}
                    </span>
                    {item.min_price != null && (
                      <span className="text-xs text-text-muted line-through">
                        {formatPrice(item.min_price)}
                      </span>
                    )}
                  </>
                ) : item.min_price != null ? (
                  <span className="text-sm font-bold text-text-primary">
                    {formatPrice(item.min_price)}
                  </span>
                ) : (
                  <span className="text-xs text-text-muted">Price unavailable</span>
                )}
              </div>

              <p className="mt-2 text-[10px] text-text-muted uppercase tracking-wider font-medium">
                Added {formatDate(item.added_at)}
              </p>
            </div>

            <button
              onClick={() => onRemove(item.product_id)}
              disabled={isRemoving}
              className="rounded-full p-2 text-rose-500 hover:bg-rose-50 hover:text-rose-600 transition-colors disabled:opacity-50 shrink-0"
              aria-label="Remove from wishlist"
            >
              <Heart className="h-4.5 w-4.5 fill-current" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
