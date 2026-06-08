import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Minus, Plus } from 'lucide-react';
import { formatPrice } from '@/common/utils/format.util';
import { ROUTES } from '@/common/constants/routes';
import { Button } from '@/common/components/ui/Button';
import { Breadcrumb } from '@/common/components/ui/Breadcrumb';
import { AddToCartButton, useAddToCart } from '@/features/cart';
import { ReviewList } from '@/features/review';
import { WishlistButton } from '@/features/wishlist';
import { ShopInfoCard } from '@/features/shop/components/ShopInfoCard';
import { useProduct } from '../hooks/useProduct';
import { useCategories } from '../hooks/useCategories';
import { ImageGallery } from '../components/ImageGallery';
import { VariantSelector } from '../components/VariantSelector';
import { ProductDetailSkeleton } from '../components/ProductDetailSkeleton';
import { getEffectivePrice, isInStock } from '../utils/product.util';
import type { ProductVariant } from '../types/product.types';

export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { data: product, isLoading, error } = useProduct(slug!);
  const { data: categories } = useCategories();
  const { mutate: addToCart, isPending: isAdding } = useAddToCart();

  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [quantity, setQuantity] = useState(1);

  if (isLoading) return <ProductDetailSkeleton />;

  if (error || !product) {
    return (
      <div className="py-12 text-center text-text-secondary">
        Product not found.
      </div>
    );
  }

  const active = selectedVariant ?? product.variants[0] ?? null;

  // Helper to find category by ID in tree
  function findCategoryById(cats: any[], id: number): any | null {
    for (const cat of cats) {
      if (cat.id === id) return cat;
      if (cat.children?.length) {
        const found = findCategoryById(cat.children, id);
        if (found) return found;
      }
    }
    return null;
  }

  const category = categories ? findCategoryById(categories, product.category_id) : null;

  const breadcrumbItems = [
    { label: 'Home', href: ROUTES.HOME },
    { label: 'Products', href: ROUTES.PRODUCTS },
    ...(category ? [{ label: category.name, href: ROUTES.CATEGORY(category.slug) }] : []),
    { label: product.name },
  ];

  function handleBuyNow() {
    if (!active) return;
    addToCart(
      { product_variant_id: active.id, quantity },
      {
        onSuccess: () => {
          navigate(ROUTES.CART);
        },
      }
    );
  }

  const handleVariantChange = (variant: ProductVariant) => {
    setSelectedVariant(variant);
    setQuantity(1); // Reset quantity to 1 when variant changes
  };

  return (
    <div className="space-y-6">
      <Breadcrumb items={breadcrumbItems} />

      <div className="space-y-10">
        <div className="grid gap-8 md:grid-cols-2">
          <ImageGallery images={product.images} productName={product.name} />

          <div className="space-y-6">
            <div>
              <div className="flex items-start justify-between gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-text-primary sm:text-3xl">{product.name}</h1>
                <WishlistButton productId={product.id} />
              </div>
              {active && (
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-text-price">
                    {formatPrice(getEffectivePrice(active))}
                  </span>
                  {active.sale_price && (
                    <span className="text-lg text-text-muted line-through">
                      {formatPrice(active.price)}
                    </span>
                  )}
                </div>
              )}
            </div>

            {active && (
              <div className="text-sm text-text-secondary">
                SKU: <span className="font-mono text-text-primary">{active.sku}</span>
                {active.stock_quantity > 0 ? (
                  <span className="ml-3 font-medium text-success-600">In stock ({active.stock_quantity})</span>
                ) : (
                  <span className="ml-3 font-medium text-error-600">Out of stock</span>
                )}
              </div>
            )}

            {product.variants.length > 0 && (product.option1_label || product.option2_label) && (
              <VariantSelector
                variants={product.variants}
                selectedVariantId={active?.id ?? null}
                onSelect={handleVariantChange}
                option1Label={product.option1_label}
                option2Label={product.option2_label}
              />
            )}

            {active && isInStock(active) ? (
              <div className="space-y-6 border-t border-border-default pt-6">
                {/* Quantity Selector */}
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium text-text-secondary">Quantity:</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      disabled={quantity <= 1 || isAdding}
                      className="flex h-9 w-9 items-center justify-center rounded-lg border border-border-default text-text-secondary hover:bg-surface-hover hover:text-text-primary disabled:opacity-50 transition-colors"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="w-10 text-center text-sm font-semibold text-text-primary">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.min(active.stock_quantity, q + 1))}
                      disabled={quantity >= active.stock_quantity || isAdding}
                      className="flex h-9 w-9 items-center justify-center rounded-lg border border-border-default text-text-secondary hover:bg-surface-hover hover:text-text-primary disabled:opacity-50 transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  <span className="text-xs text-text-muted">
                    {active.stock_quantity} available
                  </span>
                </div>

                {/* Side-by-side Add to Cart + Buy Now */}
                <div className="flex gap-4">
                  <AddToCartButton
                    variantId={active.id}
                    quantity={quantity}
                    disabled={isAdding}
                    className="flex-1 border border-border-brand text-text-brand hover:bg-brand-light shadow-sm py-3 text-sm font-bold rounded-lg transition-colors"
                  />
                  <Button
                    type="button"
                    variant="brand"
                    loading={isAdding}
                    onClick={handleBuyNow}
                    className="flex-1 py-3 text-sm font-bold"
                  >
                    Buy Now
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                disabled
                variant="secondary"
                className="w-full py-3"
              >
                Out of Stock
              </Button>
            )}

            {product.description && (
              <div className="border-t border-border-default pt-6">
                <h2 className="text-sm font-bold uppercase tracking-wider text-text-primary">Description</h2>
                <p className="mt-2 whitespace-pre-line text-sm text-text-secondary leading-relaxed">{product.description}</p>
              </div>
            )}
          </div>
        </div>

        {product.shop && (
          <ShopInfoCard shop={product.shop} />
        )}

        <div className="shop-card p-6">
          <h2 className="mb-6 text-lg font-bold tracking-tight text-text-primary">Customer Reviews</h2>
          <ReviewList productId={product.id} />
        </div>
      </div>
    </div>
  );
}
