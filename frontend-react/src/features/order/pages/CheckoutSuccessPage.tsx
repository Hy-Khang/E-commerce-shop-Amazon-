import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { CheckCircle2, ArrowRight, ShoppingBag, Loader2, Store } from 'lucide-react';
import { formatPrice } from '@/common/utils/format.util';
import { ROUTES, PAYMENT_METHOD_LABELS } from '@/common/constants/routes';
import { Button } from '@/common/components/ui/Button';
import { useOrderGroup } from '../hooks/useOrderGroup';
import { OrderStatusBadge } from '../components/OrderStatusBadge';

export default function CheckoutSuccessPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const orderGroupId = searchParams.get('orderGroupId');

  const { data: orders = [], isLoading, isError } = useOrderGroup(orderGroupId);

  if (isLoading) {
    return (
      <div className="flex h-96 flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-text-brand" />
        <p className="mt-4 text-sm text-text-secondary">Loading order details...</p>
      </div>
    );
  }

  if (isError || orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-text-secondary">Order not found.</p>
        <Link to={ROUTES.HOME} className="mt-4">
          <Button>Back to Home</Button>
        </Link>
      </div>
    );
  }

  const totalAmount = orders.reduce((sum, o) => sum + o.total_amount, 0);
  const firstOrder = orders[0];

  return (
    <div className="mx-auto max-w-2xl space-y-6 py-4 animate-in">
      {/* Step Indicator */}
      <div className="rounded-xl bg-white p-4 border border-border-default shadow-xs">
        <div className="flex items-center justify-center">
          <div className="flex items-center gap-2 text-text-brand font-semibold">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-light text-[10px] font-bold text-text-brand">1</span>
            <span className="text-xs">Cart</span>
          </div>
          <div className="mx-4 h-[1px] w-12 bg-border-brand" />
          <div className="flex items-center gap-2 text-text-brand font-semibold">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-light text-[10px] font-bold text-text-brand">2</span>
            <span className="text-xs">Checkout</span>
          </div>
          <div className="mx-4 h-[1px] w-12 bg-border-brand" />
          <div className="flex items-center gap-2 text-text-brand font-semibold">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand text-[10px] font-bold text-white">3</span>
            <span className="text-xs">Complete</span>
          </div>
        </div>
      </div>

      {/* Success Content Card */}
      <div className="shop-card bg-surface p-8 text-center space-y-6">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-light">
          <CheckCircle2 className="h-10 w-10 text-brand" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">Thank You for Your Purchase!</h1>
          <p className="text-sm text-text-secondary">
            {orders.length > 1
              ? `Your checkout created ${orders.length} orders (one per shop) and they are now being processed.`
              : 'Your order has been placed successfully and is now being processed.'}
          </p>
        </div>

        {/* Sub-orders Summary */}
        <div className="space-y-3 text-left">
          {orders.map((order) => (
            <div
              key={order.id}
              className="rounded-xl border border-border-default bg-neutral-50/50 p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Store className="h-4 w-4 text-text-muted" />
                  <span className="text-sm font-semibold text-text-primary">{order.shop_name}</span>
                </div>
                <OrderStatusBadge status={order.status} />
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-text-secondary">Order #{order.id}</span>
                <span className="font-semibold text-text-primary">{formatPrice(order.total_amount)}</span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-text-secondary">Items</span>
                <span className="text-text-primary">{order.order_items.length} item(s)</span>
              </div>

              <button
                onClick={() => navigate(ROUTES.ORDER_DETAIL(order.id))}
                className="text-xs font-semibold text-text-brand hover:text-primary-700 transition-colors"
              >
                View Details
              </button>
            </div>
          ))}
        </div>

        {/* Shared Info */}
        <div className="rounded-xl border border-border-default bg-neutral-50/50 p-6 text-left space-y-4">
          <div className="flex justify-between border-b border-border-default pb-3 text-sm">
            <span className="text-text-secondary">Payment Method</span>
            <span className="font-semibold text-text-primary">
              {PAYMENT_METHOD_LABELS[firstOrder.payment_method]}
            </span>
          </div>

          <div className="border-b border-border-default pb-3 text-sm space-y-1">
            <span className="text-text-secondary block">Shipping Address</span>
            <span className="font-medium text-text-primary block">{firstOrder.shipping_address.full_name}</span>
            <span className="text-text-secondary block text-xs">
              {firstOrder.shipping_address.phone} <br />
              {firstOrder.shipping_address.address_line}, {firstOrder.shipping_address.city}
            </span>
          </div>

          <div className="flex justify-between pt-1 text-base font-bold text-text-primary">
            <span>Total Amount</span>
            <span className="text-text-price">{formatPrice(totalAmount)}</span>
          </div>
        </div>

        {/* Action CTAs */}
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            type="button"
            variant="brand-outline"
            onClick={() => navigate(ROUTES.PRODUCTS)}
            className="flex-1 py-3"
            icon={ShoppingBag}
          >
            Continue Shopping
          </Button>
          <Button
            type="button"
            variant="brand"
            onClick={() => navigate(ROUTES.ORDERS)}
            className="flex-1 py-3"
            icon={ArrowRight}
          >
            View My Orders
          </Button>
        </div>
      </div>
    </div>
  );
}
