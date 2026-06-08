import { Link } from 'react-router-dom';
import { ROUTES } from '@/common/constants/routes';
import { formatPrice } from '@/common/utils/format.util';
import { WishlistButton } from '@/features/wishlist';
import { usePrefetchProduct } from '../hooks/usePrefetchProduct';
import { getPriceRange, hasAnyStock } from '../utils/product.util';
import type { ProductListItem } from '../types/product.types';

interface Props {
  product: ProductListItem;
}

export function ProductCard({ product }: Props) {
  const prefetch = usePrefetchProduct();
  const priceRange = getPriceRange(product.variants);
  const inStock = hasAnyStock(product.variants);

  return (
    <Link
      to={ROUTES.PRODUCT_DETAIL(product.slug)}
      onMouseEnter={() => prefetch(product.slug)}
      className="group block overflow-hidden rounded-xl border border-border-default bg-elevated transition-all hover:border-border-strong hover:shadow-sm"
    >
      <div className="relative aspect-square overflow-hidden bg-neutral-100">
        {product.thumbnail_url ? (
          <img
            src={product.thumbnail_url}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-text-muted">
            No image
          </div>
        )}
        <div className="absolute right-2 top-2">
          <WishlistButton productId={product.id} size="sm" />
        </div>
      </div>
      <div className="p-4">
        <h3 className="truncate text-sm font-semibold text-text-primary group-hover:text-text-brand transition-colors">
          {product.name}
        </h3>
        <div className="mt-1">
          {priceRange ? (
            priceRange.min === priceRange.max ? (
              <span className="text-sm font-bold text-text-price">
                {formatPrice(priceRange.min)}
              </span>
            ) : (
              <span className="text-sm font-bold text-text-price">
                {formatPrice(priceRange.min)} — {formatPrice(priceRange.max)}
              </span>
            )
          ) : (
            <span className="text-sm text-text-muted">No variants</span>
          )}
        </div>
        {!inStock && (
          <span className="mt-1 inline-block text-xs font-medium text-error-600">Out of stock</span>
        )}
      </div>
    </Link>
  );
}
