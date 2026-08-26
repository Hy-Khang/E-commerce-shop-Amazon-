import { Link } from 'react-router-dom';
import { TrendingUp, Heart } from 'lucide-react';
import { motion } from 'motion/react';
import { ROUTES } from '@/common/constants/routes';
import { formatPrice, getImageUrl } from '@/common/utils/format.util';
import { WishlistButton } from '@/features/wishlist';
import { usePrefetchProduct } from '../hooks/usePrefetchProduct';
import { ProductCardSkeleton } from './ProductCardSkeleton';
import type { TrendingProductItem } from '../types/product.types';

interface Props {
  products: TrendingProductItem[];
  isLoading?: boolean;
}

function TrendingCard({ product }: { product: TrendingProductItem }) {
  const prefetch = usePrefetchProduct();

  return (
    <Link
      to={ROUTES.PRODUCT_DETAIL(product.slug)}
      onMouseEnter={() => prefetch(product.slug)}
      className="group block overflow-hidden rounded-xl border border-border-default bg-elevated transition-all hover:border-primary-200 hover:shadow-sm"
    >
      <div className="relative aspect-square overflow-hidden bg-surface-hover">
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
        <div className="absolute right-2 top-2">
          <WishlistButton productId={product.id} size="sm" />
        </div>
        {!product.inStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-surface/60">
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
        <div className="mt-1.5 flex items-center gap-1 text-xs text-text-muted">
          <Heart className="h-3 w-3" />
          <span>{product.wishlistCount} wishlists this month</span>
        </div>
      </div>
    </Link>
  );
}

export function TrendingSection({ products, isLoading }: Props) {
  if (!isLoading && products.length === 0) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <div className="flex items-center gap-2">
        <TrendingUp className="h-5 w-5 text-primary-500" />
        <h2 className="font-display text-xl font-semibold tracking-tight text-text-primary sm:text-2xl">
          Trending Now
        </h2>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {isLoading
          ? Array.from({ length: 8 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))
          : products.map((product) => (
              <TrendingCard key={product.id} product={product} />
            ))}
      </div>
    </motion.section>
  );
}
