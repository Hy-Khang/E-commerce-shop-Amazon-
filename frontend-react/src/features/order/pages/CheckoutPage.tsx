import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { MapPin, CreditCard, Tag, Loader2 } from 'lucide-react';
import { ROUTES, PAYMENT_METHOD_LABELS } from '@/common/constants/routes';
import { formatPrice } from '@/common/utils/format.util';
import { showErrorToast } from '@/common/components/feedback/toast';
import { ApiError } from '@/core/api/api.types';
import { useCart, cartSignature, groupItemsByShop } from '@/features/cart';
import {
  CouponSelectorModal,
  VoucherRow,
  estimateCouponDiscount,
  useAppliedCouponsStore,
} from '@/features/coupon';
import {
  CoinRedeemCard,
  useCoinBalance,
  useCoinRedemptionStore,
} from '@/features/coin';
import { useCreatePayment } from '@/features/payment';
import { useCheckout } from '../hooks/useCheckout';
import { usePreviewCheckout } from '../hooks/usePreviewCheckout';
import { useAddresses } from '../hooks/useAddresses';
import { checkoutSchema, type CheckoutFormData, type PaymentMethod } from '../types/order.types';
import { CheckoutShopGroup } from '../components/CheckoutShopGroup';
import { CheckoutShopBreakdown } from '../components/CheckoutShopBreakdown';

/** Which coupon group the voucher modal is scoped to. */
type VoucherScope = 'platform' | number;

const PAYMENT_METHODS: PaymentMethod[] = ['cod', 'vnpay', 'momo'];

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { data: cart, isLoading: cartLoading } = useCart();
  const { data: addresses, isLoading: addressesLoading } = useAddresses();
  const checkout = useCheckout();
  const createPayment = useCreatePayment();
  // Voucher selection is shared with the Cart page via a store, so choices made
  // in the cart carry over here (and stay editable).
  const appliedCoupons = useAppliedCouponsStore((s) => s.appliedCoupons);
  const applyCoupon = useAppliedCouponsStore((s) => s.apply);
  const removeCoupon = useAppliedCouponsStore((s) => s.remove);
  const clearCoupons = useAppliedCouponsStore((s) => s.clear);
  // Xu (Hoàn Xu) redemption — the user's picked amount + their balance.
  const coins = useCoinRedemptionStore((s) => s.coins);
  const setCoins = useCoinRedemptionStore((s) => s.setCoins);
  const clearCoins = useCoinRedemptionStore((s) => s.clear);
  const { data: coinBalance } = useCoinBalance();

  // One scoped voucher picker shared by the platform row + every shop group,
  // mirroring the Cart page.
  const [voucher, setVoucher] = useState<{ open: boolean; scope: VoucherScope }>({
    open: false,
    scope: 'platform',
  });

  const platformCoupon = appliedCoupons.find((c) => c.validation.shop_id == null);
  const shopCouponFor = (shopId: number | null) =>
    shopId == null
      ? undefined
      : appliedCoupons.find((c) => c.validation.shop_id === shopId);

  const defaultAddress = addresses?.find((a) => a.is_default);

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors },
  } = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      payment_method: 'cod',
    },
  });

  const selectedAddressId = useWatch({ control, name: 'address_id' });
  const paymentMethod = useWatch({ control, name: 'payment_method' });

  const isProcessing = checkout.isPending || createPayment.isPending;

  // Exact totals from the server (advisory): per-shop shipping, discount split
  // and grand total. Keyed on codes + a cart signature so it refetches when items
  // or quantities change. Runs whenever the cart is non-empty — even with no
  // coupon — so shipping shows exactly instead of "calculated after order".
  const couponCodes = appliedCoupons.map((c) => c.code);
  // Shared with the Cart page's availability query so both refetch in lockstep
  // on any add/remove/quantity/price change.
  const cartSig = useMemo(() => cartSignature(cart?.items ?? []), [cart]);
  const hasCartItems = !!cart && cart.items.length > 0;

  // Redeem ceiling for the Xu card: min(balance, 50% of items after coupons).
  // Uses a LOCAL coupon estimate so it's stable and available before the preview
  // fetch. The server re-validates and returns the exact `coins_applied`.
  const subtotalRaw = (cart?.items ?? []).reduce((sum, item) => {
    const price = item.variant.sale_price ?? item.variant.price;
    return sum + price * item.quantity;
  }, 0);
  const couponDiscountEst = Math.min(
    appliedCoupons.reduce(
      (sum, c) => sum + estimateCouponDiscount(c.validation, subtotalRaw),
      0,
    ),
    subtotalRaw,
  );
  const redeemCap = Math.floor(Math.max(0, subtotalRaw - couponDiscountEst) * 0.5);
  const coinBalanceValue = coinBalance?.balance ?? 0;
  const maxRedeemable = Math.max(0, Math.min(coinBalanceValue, redeemCap));
  // Clamp the pick to the ceiling before sending it anywhere.
  const effectiveCoins = Math.min(coins, maxRedeemable);

  const preview = usePreviewCheckout(
    couponCodes,
    cartSig,
    effectiveCoins,
    hasCartItems,
  );

  function onSubmit(data: CheckoutFormData) {
    // Send the exact amount the server allocated (coins_applied) when the preview
    // is authoritative — guaranteed to pass checkout re-validation; else the
    // locally-clamped pick.
    const coinsToRedeem =
      preview.data && preview.data.shops.length > 0
        ? preview.data.coins_applied
        : effectiveCoins;
    const request = {
      ...data,
      coupon_codes: appliedCoupons.map((c) => c.code),
      coins_to_redeem: coinsToRedeem > 0 ? coinsToRedeem : undefined,
    };
    checkout.mutate(request, {
      onSuccess: (result) => {
        // Order placed — the selection has been consumed; clear it so returning
        // to the cart doesn't re-show stale vouchers.
        clearCoupons();
        clearCoins();
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
          amount: estimateCouponDiscount(c.validation, subtotal),
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
  // Xu applied: authoritative from the preview, else the locally-clamped pick.
  const coinDiscountApplied = usingPreview
    ? preview.data!.coin_discount
    : effectiveCoins;
  const coinsApplied = usingPreview ? preview.data!.coins_applied : effectiveCoins;
  const estimatedTotal = usingPreview
    ? preview.data!.grand_total
    : Math.max(0, subtotal - discountAmount - effectiveCoins);

  return (
    <div className="space-y-6">
      {/* Step Indicator */}
      <div className="rounded-xl bg-surface p-4 border border-border-default shadow-xs">
        <div className="flex items-center justify-center">
          <div className="flex items-center gap-2 text-text-secondary">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-surface-hover text-[10px] font-bold">1</span>
            <span className="text-xs font-medium">Cart</span>
          </div>
          <div className="mx-4 h-[1px] w-12 bg-border-default" />
          <div className="flex items-center gap-2 text-text-brand font-semibold">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand text-[10px] font-bold text-white">2</span>
            <span className="text-xs">Checkout</span>
          </div>
          <div className="mx-4 h-[1px] w-12 bg-border-default" />
          <div className="flex items-center gap-2 text-text-muted">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-surface-hover text-[10px] font-bold">3</span>
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
                          : 'border-border-default hover:border-border-strong bg-surface'
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
                      paymentMethod === method
                        ? 'border-border-brand bg-brand-light/30 ring-1 ring-brand/10'
                        : 'border-border-default hover:border-border-strong bg-surface'
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

            {/* Platform Voucher */}
            <div className="rounded-xl border border-border-default bg-elevated p-6">
              <div className="mb-4 flex items-center gap-2">
                <Tag className="h-5 w-5 text-text-secondary" />
                <h2 className="text-lg font-semibold text-text-primary">Platform Voucher</h2>
              </div>
              <VoucherRow
                applied={platformCoupon}
                selectLabel="Select platform voucher"
                onOpen={() => setVoucher({ open: true, scope: 'platform' })}
                onRemove={removeCoupon}
              />
              <p className="mt-3 text-xs text-text-muted">
                You can stack one platform coupon with one coupon per shop.
              </p>
              {couponCodes.length > 0 && preview.isError && (
                <p className="mt-3 text-sm text-error-600">
                  {preview.error instanceof Error
                    ? preview.error.message
                    : 'One or more coupons could not be applied'}
                  {' — '}please remove the invalid coupon.
                </p>
              )}
            </div>

            {/* Xu (Hoàn Xu) redemption */}
            <CoinRedeemCard
              balance={coinBalanceValue}
              max={maxRedeemable}
              coins={effectiveCoins}
              onChange={setCoins}
              applied={coinsApplied}
            />

            {/* Order Items Preview — grouped by shop, each with its shop voucher */}
            <div className="space-y-4">
              {groupItemsByShop(cart.items).map((group) => (
                <CheckoutShopGroup
                  key={group.shop_id ?? 'none'}
                  group={group}
                  appliedShopCoupon={shopCouponFor(group.shop_id)}
                  showVoucher
                  onOpenVoucher={(shopId) => setVoucher({ open: true, scope: shopId })}
                  onRemoveCoupon={removeCoupon}
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
                {coinDiscountApplied > 0 && (
                  <div className="flex justify-between text-sm text-amber-600">
                    <span>Coins ({coinsApplied.toLocaleString('vi-VN')})</span>
                    <span>-{formatPrice(coinDiscountApplied)}</span>
                  </div>
                )}
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
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-brand px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:bg-neutral-300 dark:disabled:bg-neutral-700 shadow-xs"
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

      <CouponSelectorModal
        open={voucher.open}
        onClose={() => setVoucher((v) => ({ ...v, open: false }))}
        appliedCoupons={appliedCoupons}
        onApply={applyCoupon}
        onRemove={removeCoupon}
        cartSig={cartSig}
        scope={voucher.scope}
        title={voucher.scope === 'platform' ? 'Platform voucher' : 'Shop voucher'}
      />
    </div>
  );
}
