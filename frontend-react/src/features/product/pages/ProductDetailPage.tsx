import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { formatPrice } from '@/common/utils/format.util';
import { AddToCartButton } from '@/features/cart';
import { ReviewList } from '@/features/review';
import { WishlistButton } from '@/features/wishlist';
import { useProduct } from '../hooks/useProduct';
import { ImageGallery } from '../components/ImageGallery';
import { VariantSelector } from '../components/VariantSelector';
import { ProductDetailSkeleton } from '../components/ProductDetailSkeleton';
import { getEffectivePrice, isInStock } from '../utils/product.util';
import type { ProductVariant } from '../types/product.types';

export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: product, isLoading, error } = useProduct(slug!);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);

  if (isLoading) return <ProductDetailSkeleton />;

  if (error || !product) {
    return (
      <div className="py-12 text-center text-gray-500">
        Product not found.
      </div>
    );
  }

  const active = selectedVariant ?? product.variants[0] ?? null;

  return (
    <div className="space-y-8">
      <div className="grid gap-8 md:grid-cols-2">
        <ImageGallery images={product.images} productName={product.name} />

        <div className="space-y-6">
          <div>
            <div className="flex items-start justify-between gap-2">
              <h1 className="text-2xl font-bold text-gray-900">{product.name}</h1>
              <WishlistButton productId={product.id} />
            </div>
            {active && (
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-red-600">
                  {formatPrice(getEffectivePrice(active))}
                </span>
                {active.sale_price && (
                  <span className="text-lg text-gray-400 line-through">
                    {formatPrice(active.price)}
                  </span>
                )}
              </div>
            )}
          </div>

          {active && (
            <div className="text-sm text-gray-600">
              SKU: {active.sku}
              {active.stock_quantity > 0 ? (
                <span className="ml-3 text-green-600">In stock ({active.stock_quantity})</span>
              ) : (
                <span className="ml-3 text-red-500">Out of stock</span>
              )}
            </div>
          )}

          {product.variants.length > 0 && (product.option1_label || product.option2_label) && (
            <VariantSelector
              variants={product.variants}
              selectedVariantId={active?.id ?? null}
              onSelect={setSelectedVariant}
              option1Label={product.option1_label}
              option2Label={product.option2_label}
            />
          )}

          {active && isInStock(active) ? (
            <AddToCartButton
              variantId={active.id}
              className="w-full rounded-md bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
            />
          ) : (
            <button
              disabled
              className="w-full rounded-md bg-gray-300 px-6 py-3 text-sm font-semibold text-white cursor-not-allowed"
            >
              Out of Stock
            </button>
          )}

          {product.description && (
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Description</h2>
              <p className="mt-2 whitespace-pre-line text-sm text-gray-600">{product.description}</p>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-lg border bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Customer Reviews</h2>
        <ReviewList productId={product.id} />
      </div>
    </div>
  );
}
