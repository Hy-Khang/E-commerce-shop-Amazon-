import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { CheckCircle2, ArrowRight, ShoppingBag, Loader2 } from 'lucide-react';
import { formatPrice } from '@/common/utils/format.util';
import { ROUTES, PAYMENT_METHOD_LABELS } from '@/common/constants/routes';
import { Button } from '@/common/components/ui/Button';
import { useOrder } from '../hooks/useOrder';

export default function CheckoutSuccessPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const orderId = Number(searchParams.get('orderId'));

  const { data: order, isLoading, isError } = useOrder(orderId);

  if (isLoading) {
    return (
      <div className="flex h-96 flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-text-brand" />
        <p className="mt-4 text-sm text-text-secondary">Loading order details...</p>
      </div>
    );
  }

  if (isError || !order || !orderId) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-text-secondary">Order not found.</p>
        <Link to={ROUTES.HOME} className="mt-4">
          <Button>Back to Home</Button>
        </Link>
      </div>
    );
  }

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
            Your order has been placed successfully and is now being processed.
          </p>
        </div>

        {/* Order Details Brief Summary */}
        <div className="rounded-xl border border-border-default bg-neutral-50/50 p-6 text-left space-y-4">
          <div className="flex justify-between border-b border-border-default pb-3 text-sm">
            <span className="text-text-secondary">Order ID</span>
            <span className="font-semibold text-text-primary">#{order.id}</span>
          </div>

          <div className="flex justify-between border-b border-border-default pb-3 text-sm">
            <span className="text-text-secondary">Payment Method</span>
            <span className="font-semibold text-text-primary">
              {PAYMENT_METHOD_LABELS[order.payment_method]}
            </span>
          </div>

          <div className="border-b border-border-default pb-3 text-sm space-y-1">
            <span className="text-text-secondary block">Shipping Address</span>
            <span className="font-medium text-text-primary block">{order.shipping_address.full_name}</span>
            <span className="text-text-secondary block text-xs">
              {order.shipping_address.phone} <br />
              {order.shipping_address.address_line}, {order.shipping_address.city}
            </span>
          </div>

          <div className="flex justify-between pt-1 text-base font-bold text-text-primary">
            <span>Total Amount</span>
            <span className="text-text-price">{formatPrice(order.total_amount)}</span>
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
            onClick={() => navigate(ROUTES.ORDER_DETAIL(order.id))}
            className="flex-1 py-3"
            icon={ArrowRight}
          >
            View Order Details
          </Button>
        </div>
      </div>
    </div>
  );
}
