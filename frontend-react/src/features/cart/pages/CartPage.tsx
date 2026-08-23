import { useEffect, useMemo, useState } from 'react';
import { ShoppingCart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/common/constants/routes';
import { useAuthStore } from '@/features/auth';
import {
  CouponSelectorModal,
  useAppliedCouponsStore,
} from '@/features/coupon';
import { useCart } from '../hooks/useCart';
import { useUpdateCartItem } from '../hooks/useUpdateCartItem';
import { useRemoveCartItem } from '../hooks/useRemoveCartItem';
import { CartShopGroup } from '../components/CartShopGroup';
import { CartSummary } from '../components/CartSummary';
import { CartPageSkeleton } from '../components/CartPageSkeleton';
import {
  cartShopIds,
  cartSignature,
  groupItemsByShop,
} from '../utils/cart.util';

type VoucherScope = 'platform' | number;

export default function CartPage() {
  const { data: cart, isLoading, isError } = useCart();
  const updateItem = useUpdateCartItem();
  const removeItem = useRemoveCartItem();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const appliedCoupons = useAppliedCouponsStore((s) => s.appliedCoupons);
  const applyCoupon = useAppliedCouponsStore((s) => s.apply);
  const removeCoupon = useAppliedCouponsStore((s) => s.remove);
  const reconcile = useAppliedCouponsStore((s) => s.reconcile);

  const [voucher, setVoucher] = useState<{ open: boolean; scope: VoucherScope }>({
    open: false,
    scope: 'platform',
  });

  const items = useMemo(() => cart?.items ?? [], [cart?.items]);
  const cartSig = useMemo(() => cartSignature(items), [items]);
  const shopIds = useMemo(() => cartShopIds(items), [items]);

  // Keep the shared voucher selection consistent with the current cart: drop
  // shop coupons whose shop left the cart, clear everything when empty. The
  // store only writes when the list actually changes, so this can't loop.
  useEffect(() => {
    if (!isAuthenticated) return;
    reconcile(shopIds, items.length === 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cartSig, isAuthenticated]);

  if (isLoading) return <CartPageSkeleton />;

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-text-muted">
        <p>Failed to load your cart. Please try again.</p>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <ShoppingCart className="h-16 w-16 text-text-muted/60" />
        <h2 className="mt-4 text-lg font-semibold text-text-primary">Your cart is empty</h2>
        <p className="mt-1 text-sm text-text-muted">Browse products and add items to your cart.</p>
        <Link
          to={ROUTES.PRODUCTS}
          className="mt-6 rounded-lg bg-brand px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-hover shadow-xs"
        >
          Browse Products
        </Link>
      </div>
    );
  }

  const isUpdating = updateItem.isPending || removeItem.isPending;
  const groups = groupItemsByShop(cart.items);

  const shopCouponFor = (shopId: number | null) =>
    shopId == null
      ? undefined
      : appliedCoupons.find((c) => c.validation.shop_id === shopId);

  const modalTitle =
    voucher.scope === 'platform' ? 'Platform voucher' : 'Shop voucher';

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold tracking-tight text-text-primary">
        Shopping Cart ({cart.items.length} {cart.items.length === 1 ? 'item' : 'items'})
      </h1>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {groups.map((group) => (
            <CartShopGroup
              key={group.shop_id ?? 'none'}
              group={group}
              appliedShopCoupon={shopCouponFor(group.shop_id)}
              showVoucher={isAuthenticated}
              onOpenVoucher={(shopId) => setVoucher({ open: true, scope: shopId })}
              onRemoveCoupon={removeCoupon}
              onUpdateQuantity={(id, quantity) => updateItem.mutate({ id, quantity })}
              onRemove={(id) => removeItem.mutate(id)}
              isUpdating={isUpdating}
            />
          ))}
        </div>
        <div>
          <CartSummary
            items={cart.items}
            showVoucher={isAuthenticated}
            onOpenPlatformVoucher={() =>
              setVoucher({ open: true, scope: 'platform' })
            }
          />
        </div>
      </div>

      {isAuthenticated && (
        <CouponSelectorModal
          open={voucher.open}
          onClose={() => setVoucher((v) => ({ ...v, open: false }))}
          appliedCoupons={appliedCoupons}
          onApply={applyCoupon}
          onRemove={removeCoupon}
          cartSig={cartSig}
          scope={voucher.scope}
          title={modalTitle}
        />
      )}
    </div>
  );
}
