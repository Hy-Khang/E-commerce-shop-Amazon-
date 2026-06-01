import { Link } from 'react-router-dom';
import { Heart, Package } from 'lucide-react';
import { formatPrice } from '@/common/utils/format.util';
import { formatDate } from '@/common/utils/format.util';
import { ROUTES } from '@/common/constants/routes';
import type { WishlistItem } from '../types/wishlist.types';

interface Props {
  item: WishlistItem;
  onRemove: (productId: number) => void;
  isRemoving: boolean;
}

export function WishlistItemCard({ item, onRemove, isRemoving }: Props) {
  return (
    <div className={`rounded-lg border bg-white p-4 ${!item.product_is_active ? 'opacity-60' : ''}`}>
      <div className="flex gap-4">
        <Link
          to={ROUTES.PRODUCT_DETAIL(item.product_slug)}
          className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-md border bg-gray-100"
        >
          {item.product_thumbnail_url ? (
            <img
              src={item.product_thumbnail_url}
              alt={item.product_name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Package className="h-8 w-8 text-gray-400" />
            </div>
          )}
        </Link>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <Link
                to={ROUTES.PRODUCT_DETAIL(item.product_slug)}
                className="text-sm font-medium text-gray-900 hover:text-blue-600"
              >
                {item.product_name}
              </Link>

              {!item.product_is_active && (
                <span className="ml-2 rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-500">
                  Unavailable
                </span>
              )}

              <div className="mt-1 flex items-baseline gap-2">
                {item.min_sale_price != null ? (
                  <>
                    <span className="text-sm font-semibold text-red-600">
                      {formatPrice(item.min_sale_price)}
                    </span>
                    {item.min_price != null && (
                      <span className="text-xs text-gray-400 line-through">
                        {formatPrice(item.min_price)}
                      </span>
                    )}
                  </>
                ) : item.min_price != null ? (
                  <span className="text-sm font-semibold text-gray-900">
                    {formatPrice(item.min_price)}
                  </span>
                ) : (
                  <span className="text-sm text-gray-400">Price unavailable</span>
                )}
              </div>

              <p className="mt-1 text-xs text-gray-500">
                Added {formatDate(item.added_at)}
              </p>
            </div>

            <button
              onClick={() => onRemove(item.product_id)}
              disabled={isRemoving}
              className="flex-shrink-0 rounded-full p-1.5 text-red-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
              aria-label="Remove from wishlist"
            >
              <Heart className="h-4 w-4 fill-current" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
