import { ShoppingCart } from 'lucide-react';
import { useTrackActivityCallback } from '@/features/recommendations';
import { useAddToCart } from '../hooks/useAddToCart';

interface Props {
  variantId: number;
  quantity?: number;
  disabled?: boolean;
  className?: string;
  /** Product id for the ADD_TO_CART recommendation signal (opt-in — omit to skip). */
  productId?: number;
}

export function AddToCartButton({ variantId, quantity = 1, disabled, className, productId }: Props) {
  const { mutate: addToCart, isPending } = useAddToCart();
  const track = useTrackActivityCallback();

  return (
    <button
      onClick={() =>
        addToCart(
          { product_variant_id: variantId, quantity },
          {
            onSuccess: () => {
              if (productId) {
                track({ action: 'ADD_TO_CART', target_type: 'product', target_id: productId });
              }
            },
          },
        )
      }
      disabled={disabled || isPending}
      className={`flex items-center justify-center gap-2 ${className ?? 'rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:bg-neutral-300'}`}
    >
      <ShoppingCart className="h-4 w-4" />
      {isPending ? 'Adding...' : 'Add to Cart'}
    </button>
  );
}
