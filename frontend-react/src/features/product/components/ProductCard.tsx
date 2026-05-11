import { Link } from 'react-router-dom';
import { ROUTES } from '@/common/constants/routes';
import { formatPrice } from '@/common/utils/format.util';
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
      className="group block overflow-hidden rounded-lg border bg-white transition-shadow hover:shadow-md"
    >
      <div className="aspect-square overflow-hidden bg-gray-100">
        {product.thumbnail_url ? (
          <img
            src={product.thumbnail_url}
            alt={product.name}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-gray-400">
            No image
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="truncate text-sm font-medium text-gray-900 group-hover:text-blue-600">
          {product.name}
        </h3>
        <div className="mt-1">
          {priceRange ? (
            priceRange.min === priceRange.max ? (
              <span className="text-sm font-semibold text-red-600">
                {formatPrice(priceRange.min)}
              </span>
            ) : (
              <span className="text-sm font-semibold text-red-600">
                {formatPrice(priceRange.min)} — {formatPrice(priceRange.max)}
              </span>
            )
          ) : (
            <span className="text-sm text-gray-400">No variants</span>
          )}
        </div>
        {!inStock && (
          <span className="mt-1 inline-block text-xs text-red-500">Out of stock</span>
        )}
      </div>
    </Link>
  );
}
