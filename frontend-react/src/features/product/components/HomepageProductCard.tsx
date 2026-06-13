import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/common/constants/routes';
import { formatPrice, getImageUrl } from '@/common/utils/format.util';
import { WishlistButton } from '@/features/wishlist';
import { usePrefetchProduct } from '../hooks/usePrefetchProduct';
import type { HomepageProductItem } from '../types/product.types';

interface Props {
  product: HomepageProductItem;
  badge?: ReactNode;
}

export function HomepageProductCard({ product, badge }: Props) {
  const prefetch = usePrefetchProduct();

  return (
    <Link
      to={ROUTES.PRODUCT_DETAIL(product.slug)}
      onMouseEnter={() => prefetch(product.slug)}
      className="group block overflow-hidden rounded-xl border border-border-default bg-elevated transition-all hover:border-border-strong hover:shadow-sm"
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
        {badge && (
          <div className="absolute left-2 top-2">{badge}</div>
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
        <h3 className="truncate text-sm font-semibold text-text-primary group-hover:text-text-brand transition-colors">
          {product.name}
        </h3>
        <div className="mt-1">
          <span className="text-sm font-bold text-text-price">
            {formatPrice(product.price)}
          </span>
        </div>
      </div>
    </Link>
  );
}
