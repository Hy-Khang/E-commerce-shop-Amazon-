import { Link } from 'react-router-dom';
import { ROUTES } from '@/common/constants/routes';
import { formatPrice, getImageUrl } from '@/common/utils/format.util';
import { WishlistButton } from '@/features/wishlist';
import { usePrefetchProduct } from '../hooks/usePrefetchProduct';
import type { HomepageProductItem } from '../types/product.types';

interface Props {
  product: HomepageProductItem;
}

export function SaleProductCard({ product }: Props) {
  const prefetch = usePrefetchProduct();
  const hasDiscount = product.originalPrice && product.originalPrice > product.price;

  return (
    <Link
      to={ROUTES.PRODUCT_DETAIL(product.slug)}
      onMouseEnter={() => prefetch(product.slug)}
      className="group block overflow-hidden rounded-xl border border-border-default bg-elevated transition-all hover:border-amber-200 hover:shadow-sm"
    >
      <div className="relative aspect-square overflow-hidden bg-neutral-100">
        {product.thumbnailUrl ? (
          <img
            src={getImageUrl(product.thumbnailUrl)}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-text-muted">
            No image
          </div>
        )}
        {product.maxDiscountPercent && (
          <div className="absolute left-2 top-2">
            <span className="inline-flex items-center rounded-full bg-amber-600 px-2.5 py-1 text-xs font-bold text-white shadow-sm">
              -{product.maxDiscountPercent}%
            </span>
          </div>
        )}
        <div className="absolute right-2 top-2">
          <WishlistButton productId={product.id} size="sm" />
        </div>
        {!product.inStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/60">
            <span className="rounded-full bg-neutral-800/80 px-3 py-1 text-xs font-semibold text-white">
              Out of stock
            </span>
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="truncate text-sm font-semibold text-text-primary group-hover:text-amber-700 transition-colors">
          {product.name}
        </h3>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-sm font-bold text-amber-700">
            {formatPrice(product.price)}
          </span>
          {hasDiscount && (
            <span className="text-xs text-text-muted line-through">
              {formatPrice(product.originalPrice!)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
