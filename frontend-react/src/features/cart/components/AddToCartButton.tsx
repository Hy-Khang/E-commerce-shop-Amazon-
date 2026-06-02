import { ShoppingCart } from 'lucide-react';
import { useAddToCart } from '../hooks/useAddToCart';

interface Props {
  variantId: number;
  quantity?: number;
  disabled?: boolean;
  className?: string;
}

export function AddToCartButton({ variantId, quantity = 1, disabled, className }: Props) {
  const { mutate: addToCart, isPending } = useAddToCart();

  return (
    <button
      onClick={() => addToCart({ product_variant_id: variantId, quantity })}
      disabled={disabled || isPending}
      className={`flex items-center justify-center gap-2 ${className ?? 'rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300'}`}
    >
      <ShoppingCart className="h-4 w-4" />
      {isPending ? 'Adding...' : 'Add to Cart'}
    </button>
  );
}
