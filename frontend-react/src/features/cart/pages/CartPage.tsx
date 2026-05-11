import { ShoppingCart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/common/constants/routes';
import { useCart } from '../hooks/useCart';
import { useUpdateCartItem } from '../hooks/useUpdateCartItem';
import { useRemoveCartItem } from '../hooks/useRemoveCartItem';
import { CartItemList } from '../components/CartItemList';
import { CartSummary } from '../components/CartSummary';
import { CartPageSkeleton } from '../components/CartPageSkeleton';

export default function CartPage() {
  const { data: cart, isLoading, isError } = useCart();
  const updateItem = useUpdateCartItem();
  const removeItem = useRemoveCartItem();

  const isUpdating = updateItem.isPending || removeItem.isPending;

  if (isLoading) return <CartPageSkeleton />;

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-500">
        <p>Failed to load your cart. Please try again.</p>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <ShoppingCart className="h-16 w-16 text-gray-300" />
        <h2 className="mt-4 text-lg font-medium text-gray-900">Your cart is empty</h2>
        <p className="mt-1 text-sm text-gray-500">Browse products and add items to your cart.</p>
        <Link
          to={ROUTES.PRODUCTS}
          className="mt-6 rounded-md bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Browse Products
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">
        Shopping Cart ({cart.items.length} {cart.items.length === 1 ? 'item' : 'items'})
      </h1>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <CartItemList
            items={cart.items}
            onUpdateQuantity={(id, quantity) => updateItem.mutate({ id, quantity })}
            onRemove={(id) => removeItem.mutate(id)}
            isUpdating={isUpdating}
          />
        </div>
        <div>
          <CartSummary items={cart.items} />
        </div>
      </div>
    </div>
  );
}
