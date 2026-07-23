import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { MapPin, CreditCard, Tag, Loader2 } from 'lucide-react';
import { ROUTES, PAYMENT_METHOD_LABELS } from '@/common/constants/routes';
import { formatPrice } from '@/common/utils/format.util';
import { showErrorToast } from '@/common/components/feedback/toast';
import { useCart } from '@/features/cart';
import { CouponInput, type CouponValidationResult } from '@/features/coupon';
import { useCreatePayment } from '@/features/payment';
import { useCheckout } from '../hooks/useCheckout';
import { useAddresses } from '../hooks/useAddresses';
import { checkoutSchema, type CheckoutFormData, type PaymentMethod } from '../types/order.types';
import { OrderItemRow } from '../components/OrderItemRow';

const PAYMENT_METHODS: PaymentMethod[] = ['cod', 'vnpay', 'momo'];

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { data: cart, isLoading: cartLoading } = useCart();
  const { data: addresses, isLoading: addressesLoading } = useAddresses();
  const checkout = useCheckout();
  const createPayment = useCreatePayment();
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; validation: CouponValidationResult } | null>(null);

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

  const isProcessing = checkout.isPending || createPayment.isPending;

  function onSubmit(data: CheckoutFormData) {
    const request = {
      ...data,
      coupon_code: appliedCoupon?.code,
    };
    checkout.mutate(request, {
      onSuccess: (order) => {
        if (data.payment_method === 'cod') {
          navigate(`/checkout/success?orderId=${order.id}`);
          return;
        }
        createPayment.mutate(
          { order_id: order.id },
          {
            onSuccess: (paymentData) => {
              window.location.href = paymentData.payment_url;
            },
            onError: (error) => {
              showErrorToast(error);
              navigate(ROUTES.ORDER_DETAIL(order.id));
            },
          },
        );
      },
    });
  }

  if (cartLoading || addressesLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-text-muted" />
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <p className="text-text-secondary">Your cart is empty.</p>
        <button
          onClick={() => navigate(ROUTES.PRODUCTS)}
          className="mt-4 rounded-lg bg-brand px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-hover shadow-xs"
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

  const discountAmount = appliedCoupon ? calculateDiscount(appliedCoupon.validation, subtotal) : 0;
  const estimatedTotal = subtotal - discountAmount;

  return (
    <div className="space-y-6">
      {/* Step Indicator */}
      <div className="rounded-xl bg-white p-4 border border-border-default shadow-xs">
        <div className="flex items-center justify-center">
          <div className="flex items-center gap-2 text-text-secondary">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-neutral-100 text-[10px] font-bold">1</span>
            <span className="text-xs font-medium">Cart</span>
          </div>
          <div className="mx-4 h-[1px] w-12 bg-border-default" />
          <div className="flex items-center gap-2 text-text-brand font-semibold">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand text-[10px] font-bold text-white">2</span>
            <span className="text-xs">Checkout</span>
          </div>
          <div className="mx-4 h-[1px] w-12 bg-border-default" />
          <div className="flex items-center gap-2 text-text-muted">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-neutral-100 text-[10px] font-bold">3</span>
            <span className="text-xs">Complete</span>
          </div>
        </div>
      </div>

      <h1 className="text-2xl font-bold tracking-tight text-text-primary">Checkout</h1>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            {/* Shipping Address */}
            <div className="rounded-xl border border-border-default bg-elevated p-6">
              <div className="mb-4 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-text-secondary" />
                <h2 className="text-lg font-semibold text-text-primary">Shipping Address</h2>
              </div>

              {!addresses || addresses.length === 0 ? (
                <div className="rounded-lg bg-amber-50 p-4 text-sm text-amber-700 ring-1 ring-inset ring-amber-600/20">
                  No addresses found. Please add an address in your profile first.
                </div>
              ) : (
                <div className="space-y-3">
                  {addresses.map((address) => (
                    <label
                      key={address.id}
                      className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors ${
                        selectedAddressId === address.id
                          ? 'border-border-brand bg-brand-light/30 ring-1 ring-brand/10'
                          : 'border-border-default hover:border-border-strong bg-white'
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
                        <p className="text-sm font-medium text-text-primary">
                          {address.full_name}
                          {address.is_default && (
                            <span className="ml-2 rounded-full bg-brand-light px-2 py-0.5 text-[10px] font-bold text-text-brand uppercase tracking-wider">
                              Default
                            </span>
                          )}
                        </p>
                        <p className="mt-0.5 text-sm text-text-secondary">{address.phone}</p>
                        <p className="text-sm text-text-secondary">
                          {address.address_line}, {address.city}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              )}
              {errors.address_id && (
                <p className="mt-2 text-sm text-error-600">{errors.address_id.message}</p>
              )}
            </div>

            {/* Payment Method */}
            <div className="rounded-xl border border-border-default bg-elevated p-6">
              <div className="mb-4 flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-text-secondary" />
                <h2 className="text-lg font-semibold text-text-primary">Payment Method</h2>
              </div>

              <div className="space-y-3">
                {PAYMENT_METHODS.map((method) => (
                  <label
                    key={method}
                    className={`flex cursor-pointer items-center gap-3 rounded-lg border p-4 transition-colors ${
                      watch('payment_method') === method
                        ? 'border-border-brand bg-brand-light/30 ring-1 ring-brand/10'
                        : 'border-border-default hover:border-border-strong bg-white'
                    }`}
                  >
                    <input
                      type="radio"
                      value={method}
                      {...register('payment_method')}
                      className="accent-brand"
                    />
                    <span className="text-sm font-medium text-text-primary">
                      {PAYMENT_METHOD_LABELS[method]}
                    </span>
                  </label>
                ))}
              </div>
              {errors.payment_method && (
                <p className="mt-2 text-sm text-error-600">{errors.payment_method.message}</p>
              )}
            </div>

            {/* Coupon Code */}
            <div className="rounded-xl border border-border-default bg-elevated p-6">
              <div className="mb-4 flex items-center gap-2">
                <Tag className="h-5 w-5 text-text-secondary" />
                <h2 className="text-lg font-semibold text-text-primary">Coupon Code</h2>
              </div>
              <CouponInput
                appliedCode={appliedCoupon?.code ?? null}
                onApply={(code, validation) => setAppliedCoupon({ code, validation })}
                onRemove={() => setAppliedCoupon(null)}
              />
            </div>

            {/* Order Items Preview */}
            <div className="rounded-xl border border-border-default bg-elevated p-6">
              <h2 className="mb-4 text-lg font-semibold text-text-primary">
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
            <div className="sticky top-[7.5rem] rounded-xl border border-border-default bg-elevated p-6">
              <h2 className="text-lg font-semibold text-text-primary">Order Summary</h2>

              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-sm text-text-secondary">
                  <span>Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                {appliedCoupon && (
                  <div className="flex justify-between text-sm text-emerald-700">
                    <span>Coupon ({appliedCoupon.code})</span>
                    <span>-{formatPrice(discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm text-text-secondary">
                  <span>Shipping</span>
                  <span className="text-text-muted">Calculated after order</span>
                </div>
              </div>

              <div className="mt-4 border-t border-border-default pt-4">
                <div className="flex justify-between text-base font-bold text-text-primary">
                  <span>Estimated Total</span>
                  <span>{formatPrice(estimatedTotal)}</span>
                </div>
                {appliedCoupon && (
                  <p className="mt-1 text-xs text-emerald-700">
                    You save {formatPrice(discountAmount)} with this coupon
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isProcessing || !addresses || addresses.length === 0}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-brand px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:bg-neutral-300 shadow-xs"
              >
                {isProcessing && <Loader2 className="h-4 w-4 animate-spin" />}
                {createPayment.isPending
                  ? 'Redirecting to payment...'
                  : checkout.isPending
                    ? 'Placing Order...'
                    : 'Place Order'}
              </button>

              {(checkout.isError || createPayment.isError) && (
                <p className="mt-2 text-center text-sm text-error-600">
                  {(checkout.error ?? createPayment.error) instanceof Error
                    ? (checkout.error ?? createPayment.error)?.message
                    : 'Failed to place order'}
                </p>
              )}
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

function calculateDiscount(coupon: CouponValidationResult, subtotal: number): number {
  if (coupon.min_order_amount && subtotal < coupon.min_order_amount) return 0;

  let discount: number;
  if (coupon.discount_type === 'percentage') {
    discount = subtotal * coupon.discount_value / 100;
    if (coupon.max_discount_amount) {
      discount = Math.min(discount, coupon.max_discount_amount);
    }
  } else {
    discount = coupon.discount_value;
  }

  return Math.min(discount, subtotal);
}
