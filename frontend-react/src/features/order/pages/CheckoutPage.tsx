import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { MapPin, CreditCard, Tag, Loader2 } from 'lucide-react';
import { ROUTES, PAYMENT_METHOD_LABELS } from '@/common/constants/routes';
import { formatPrice } from '@/common/utils/format.util';
import { showErrorToast } from '@/common/components/feedback/toast';
import { ApiError } from '@/core/api/api.types';
import { useCart } from '@/features/cart';
import { CouponPicker, type CouponValidationResult, type AppliedCouponEntry } from '@/features/coupon';
import { useCreatePayment } from '@/features/payment';
import { useCheckout } from '../hooks/useCheckout';
import { usePreviewCheckout } from '../hooks/usePreviewCheckout';
import { useAddresses } from '../hooks/useAddresses';
import { checkoutSchema, type CheckoutFormData, type PaymentMethod } from '../types/order.types';
import { OrderItemRow } from '../components/OrderItemRow';
import { CheckoutShopBreakdown } from '../components/CheckoutShopBreakdown';

const PAYMENT_METHODS: PaymentMethod[] = ['cod', 'vnpay', 'momo'];

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { data: cart, isLoading: cartLoading } = useCart();
  const { data: addresses, isLoading: addressesLoading } = useAddresses();
  const checkout = useCheckout();
  const createPayment = useCreatePayment();
  const [appliedCoupons, setAppliedCoupons] = useState<AppliedCouponEntry[]>([]);

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

  // Exact totals from the server (advisory): per-shop shipping, discount split
  // and grand total. Keyed on codes + a cart signature so it refetches when items
  // or quantities change. Runs whenever the cart is non-empty — even with no
  // coupon — so shipping shows exactly instead of "calculated after order".
  const couponCodes = appliedCoupons.map((c) => c.code);
  const cartSig = useMemo(
    () =>
      (cart?.items ?? [])
        .map(
          (i) =>
            `${i.product_variant_id}:${i.quantity}:${i.variant.sale_price ?? i.variant.price}`,
        )
        .join('|'),
    [cart],
  );
  const hasCartItems = !!cart && cart.items.length > 0;
  const preview = usePreviewCheckout(couponCodes, cartSig, hasCartItems);

  function onSubmit(data: CheckoutFormData) {
    const request = {
      ...data,
      coupon_codes: appliedCoupons.map((c) => c.code),
    };
    checkout.mutate(request, {
      onSuccess: (result) => {
        if (data.payment_method === 'cod') {
          navigate(`/checkout/success?orderGroupId=${result.order_group_id}`);
          return;
        }
        createPayment.mutate(
          { order_group_id: result.order_group_id },
          {
            onSuccess: (paymentData) => {
              window.location.href = paymentData.payment_url;
            },
            onError: (error) => {
              showErrorToast(error);
              navigate(`/checkout/success?orderGroupId=${result.order_group_id}`);
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

  // Prefer the server preview (exact). Fall back to a local estimate only while
  // the preview is loading. If the preview rejected a coupon, show no discount
  // (the error under the coupon input tells the user to remove it) rather than a
  // phantom saving the server won't honour.
  // Trust the preview only when it resolved to at least one shop order. An empty
  // `shops` (every cart item lacks a shop_id → nothing orderable) returns all
  // zeros; falling back to the local subtotal avoids showing a "0" grand total
  // next to a non-zero subtotal.
  const usingPreview = !!preview.data && preview.data.shops.length > 0;
  const previewErrored = couponCodes.length > 0 && preview.isError;
  // A coupon-level rejection (COUPON_0xx, 400) is deterministic — block submit.
  // A transient/network error is not: leave the button enabled and let checkout
  // re-validate (it's the source of truth).
  const couponRejected =
    previewErrored &&
    preview.error instanceof ApiError &&
    preview.error.code.startsWith('COUPON_');
  const couponBreakdown = usingPreview
    ? preview.data!.applied_coupons.map((c) => ({
        code: c.code,
        amount: c.discount_amount,
      }))
    : previewErrored
      ? []
      : appliedCoupons.map((c) => ({
          code: c.code,
          amount: calculateDiscount(c.validation, subtotal),
        }));
  const discountAmount = usingPreview
    ? preview.data!.discount_total
    : previewErrored
      ? 0
      : Math.min(
          couponBreakdown.reduce((sum, c) => sum + c.amount, 0),
          subtotal,
        );
  // When the preview is authoritative, drive every summary line from it (subtotal
  // included) so the numbers can never disagree with each other or with checkout.
  const displaySubtotal = usingPreview ? preview.data!.subtotal : subtotal;
  const shippingTotal = usingPreview ? preview.data!.shipping_total : null;
  const estimatedTotal = usingPreview
    ? preview.data!.grand_total
    : subtotal - discountAmount;

  function handleApplyCoupon(code: string, validation: CouponValidationResult) {
    setAppliedCoupons((prev) => [...prev, { code, validation }]);
  }

  function handleRemoveCoupon(code: string) {
    setAppliedCoupons((prev) => prev.filter((c) => c.code !== code));
  }

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
              <CouponPicker
                appliedCoupons={appliedCoupons}
                onApply={handleApplyCoupon}
                onRemove={handleRemoveCoupon}
                cartSig={cartSig}
              />
              {couponCodes.length > 0 && preview.isError && (
                <p className="mt-3 text-sm text-error-600">
                  {preview.error instanceof Error
                    ? preview.error.message
                    : 'One or more coupons could not be applied'}
                  {' — '}please remove the invalid coupon.
                </p>
              )}
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
                    product_id: null,
                    variant_option1_label: null,
                    variant_option1_value: null,
                    variant_option2_label: null,
                    variant_option2_value: null,
                    shop_id: null,
                    shop_name: null,
                    product_slug: null,
                    shop_slug: null,
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
                  <span>{formatPrice(displaySubtotal)}</span>
                </div>
                {couponBreakdown.map((c) => (
                  <div key={c.code} className="flex justify-between text-sm text-emerald-700">
                    <span>Coupon ({c.code})</span>
                    <span>-{formatPrice(c.amount)}</span>
                  </div>
                ))}
                <div className="flex justify-between text-sm text-text-secondary">
                  <span>Shipping</span>
                  {shippingTotal !== null ? (
                    <span>{formatPrice(shippingTotal)}</span>
                  ) : (
                    <span className="text-text-muted">Calculated after order</span>
                  )}
                </div>
              </div>

              {usingPreview && <CheckoutShopBreakdown shops={preview.data!.shops} />}

              <div className="mt-4 border-t border-border-default pt-4">
                <div className="flex justify-between text-base font-bold text-text-primary">
                  <span>Estimated Total</span>
                  <span>{formatPrice(estimatedTotal)}</span>
                </div>
                {appliedCoupons.length > 0 && discountAmount > 0 && (
                  <p className="mt-1 text-xs text-emerald-700">
                    {usingPreview
                      ? `You save ${formatPrice(discountAmount)}`
                      : `You save ~${formatPrice(discountAmount)} — final discount confirmed at checkout`}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={
                  isProcessing ||
                  !addresses ||
                  addresses.length === 0 ||
                  couponRejected
                }
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-brand px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:bg-neutral-300 shadow-xs"
              >
                {isProcessing && <Loader2 className="h-4 w-4 animate-spin" />}
                {createPayment.isPending
                  ? 'Redirecting to payment...'
                  : checkout.isPending
                    ? 'Placing Order...'
                    : couponRejected
                      ? 'Remove invalid coupon to continue'
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
