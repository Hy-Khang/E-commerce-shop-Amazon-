import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { MapPin, CreditCard, Loader2 } from 'lucide-react';
import { ROUTES, PAYMENT_METHOD_LABELS } from '@/common/constants/routes';
import { formatPrice } from '@/common/utils/format.util';
import { useCart } from '@/features/cart';
import { useCheckout } from '../hooks/useCheckout';
import { useAddresses } from '../hooks/useAddresses';
import { checkoutSchema, type CheckoutFormData, type PaymentMethod } from '../types/order.types';
import { OrderItemRow } from '../components/OrderItemRow';

const PAYMENT_METHODS: PaymentMethod[] = ['cod', 'banking', 'momo'];

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { data: cart, isLoading: cartLoading } = useCart();
  const { data: addresses, isLoading: addressesLoading } = useAddresses();
  const checkout = useCheckout();

  const defaultAddress = addresses?.find((a) => a.is_default);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      payment_method: 'cod',
    },
  });

  const selectedAddressId = watch('address_id');

  function onSubmit(data: CheckoutFormData) {
    checkout.mutate(data, {
      onSuccess: (order) => {
        navigate(ROUTES.ORDER_DETAIL(order.id));
      },
    });
  }

  if (cartLoading || addressesLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <p className="text-gray-500">Your cart is empty.</p>
        <button
          onClick={() => navigate(ROUTES.PRODUCTS)}
          className="mt-4 rounded-md bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Browse Products
        </button>
      </div>
    );
  }

  if (defaultAddress && !selectedAddressId) {
    setValue('address_id', defaultAddress.id);
  }

  const subtotal = cart.items.reduce((sum, item) => {
    const price = item.variant.sale_price ?? item.variant.price;
    return sum + price * item.quantity;
  }, 0);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Checkout</h1>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            {/* Shipping Address */}
            <div className="rounded-lg border bg-white p-6">
              <div className="mb-4 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-gray-600" />
                <h2 className="text-lg font-semibold text-gray-900">Shipping Address</h2>
              </div>

              {!addresses || addresses.length === 0 ? (
                <div className="rounded-md bg-yellow-50 p-4 text-sm text-yellow-800">
                  No addresses found. Please add an address in your profile first.
                </div>
              ) : (
                <div className="space-y-3">
                  {addresses.map((address) => (
                    <label
                      key={address.id}
                      className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors ${
                        selectedAddressId === address.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        value={address.id}
                        checked={selectedAddressId === address.id}
                        onChange={() => setValue('address_id', address.id, { shouldValidate: true })}
                        className="mt-1"
                      />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {address.full_name}
                          {address.is_default && (
                            <span className="ml-2 rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700">
                              Default
                            </span>
                          )}
                        </p>
                        <p className="mt-0.5 text-sm text-gray-600">{address.phone}</p>
                        <p className="text-sm text-gray-600">
                          {address.address_line}, {address.city}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              )}
              {errors.address_id && (
                <p className="mt-2 text-sm text-red-600">{errors.address_id.message}</p>
              )}
            </div>

            {/* Payment Method */}
            <div className="rounded-lg border bg-white p-6">
              <div className="mb-4 flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-gray-600" />
                <h2 className="text-lg font-semibold text-gray-900">Payment Method</h2>
              </div>

              <div className="space-y-3">
                {PAYMENT_METHODS.map((method) => (
                  <label
                    key={method}
                    className={`flex cursor-pointer items-center gap-3 rounded-lg border p-4 transition-colors ${
                      watch('payment_method') === method
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      value={method}
                      {...register('payment_method')}
                      className="accent-blue-600"
                    />
                    <span className="text-sm font-medium text-gray-900">
                      {PAYMENT_METHOD_LABELS[method]}
                    </span>
                  </label>
                ))}
              </div>
              {errors.payment_method && (
                <p className="mt-2 text-sm text-red-600">{errors.payment_method.message}</p>
              )}
            </div>

            {/* Order Items Preview */}
            <div className="rounded-lg border bg-white p-6">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">
                Items ({cart.items.length})
              </h2>
              {cart.items.map((item) => (
                <OrderItemRow
                  key={item.id}
                  item={{
                    id: item.id,
                    order_id: 0,
                    product_variant_id: item.product_variant_id,
                    product_name: item.variant.product_name,
                    sku: item.variant.sku,
                    price: item.variant.sale_price ?? item.variant.price,
                    quantity: item.quantity,
                    thumbnail_url: item.variant.thumbnail_url,
                  }}
                />
              ))}
            </div>
          </div>

          {/* Order Summary */}
          <div>
            <div className="sticky top-4 rounded-lg border bg-white p-6">
              <h2 className="text-lg font-semibold text-gray-900">Order Summary</h2>

              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Shipping</span>
                  <span className="text-gray-400">Calculated after order</span>
                </div>
              </div>

              <div className="mt-4 border-t pt-4">
                <div className="flex justify-between text-base font-semibold text-gray-900">
                  <span>Estimated Total</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={checkout.isPending || !addresses || addresses.length === 0}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-3 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
              >
                {checkout.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                {checkout.isPending ? 'Placing Order...' : 'Place Order'}
              </button>

              {checkout.isError && (
                <p className="mt-2 text-center text-sm text-red-600">
                  {checkout.error instanceof Error ? checkout.error.message : 'Failed to place order'}
                </p>
              )}
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
