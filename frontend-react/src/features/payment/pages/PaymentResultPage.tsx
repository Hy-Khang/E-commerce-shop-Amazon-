import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle2, XCircle, Loader2, ShoppingBag, ArrowRight, RefreshCw, Store } from 'lucide-react';
import { formatPrice } from '@/common/utils/format.util';
import { ROUTES, PAYMENT_METHOD_LABELS } from '@/common/constants/routes';
import { Button } from '@/common/components/ui/Button';
import { showErrorToast } from '@/common/components/feedback/toast';
import { useOrderGroup, OrderStatusBadge } from '@/features/order';
import { useCreatePayment } from '../hooks/useCreatePayment';

export default function PaymentResultPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const orderGroupId = searchParams.get('orderGroupId');
  const status = searchParams.get('status');

  const { data: orders = [], isLoading, isError } = useOrderGroup(orderGroupId);

  const createPayment = useCreatePayment();
  const isSuccess = status === 'success';

  function handleRetryPayment() {
    if (!orderGroupId || orders.length === 0) return;
    createPayment.mutate({ order_group_id: orderGroupId }, {
      onSuccess: (data) => {
        window.location.href = data.payment_url;
      },
      onError: (error) => {
        showErrorToast(error);
      },
    });
  }

  if (isLoading) {
    return (
      <div className="flex h-96 flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-text-brand" />
        <p className="mt-4 text-sm text-text-secondary">Loading payment result...</p>
      </div>
    );
  }

  if (isError || orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-text-secondary">Order not found.</p>
        <Button onClick={() => navigate(ROUTES.HOME)} className="mt-4">
          Back to Home
        </Button>
      </div>
    );
  }

  const totalAmount = orders.reduce((sum, o) => sum + o.total_amount, 0);
  const firstOrder = orders[0];

  return (
    <div className="mx-auto max-w-2xl space-y-6 py-4 animate-in">
      {/* Step Indicator */}
      <div className="rounded-xl bg-surface p-4 border border-border-default shadow-xs">
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
            <span className="text-xs">Payment</span>
          </div>
        </div>
      </div>

      {/* Result Card */}
      <div className="shop-card bg-surface p-8 text-center space-y-6">
        <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${isSuccess ? 'bg-brand-light' : 'bg-red-50'}`}>
          {isSuccess ? (
            <CheckCircle2 className="h-10 w-10 text-brand" />
          ) : (
            <XCircle className="h-10 w-10 text-red-500" />
          )}
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">
            {isSuccess ? 'Payment Successful!' : 'Payment Failed'}
          </h1>
          <p className="text-sm text-text-secondary">
            {isSuccess
              ? 'Your payment has been processed successfully.'
              : 'Your payment could not be completed. You can try again or choose a different payment method.'}
          </p>
        </div>

        {/* Order Summary */}
        {orders.length > 1 ? (
          <div className="space-y-3 text-left">
            {orders.map((order) => (
              <div
                key={order.id}
                className="rounded-xl border border-border-default bg-surface-hover/50 p-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Store className="h-4 w-4 text-text-muted" />
                    <span className="text-sm font-semibold text-text-primary">{order.shop_name}</span>
                  </div>
                  <OrderStatusBadge status={order.status} />
                </div>
                <div className="mt-2 flex justify-between text-sm">
                  <span className="text-text-secondary">Order #{order.id}</span>
                  <span className="font-semibold text-text-primary">{formatPrice(order.total_amount)}</span>
                </div>
                <div className="mt-1 flex justify-between text-sm">
                  <span className="text-text-secondary">Payment</span>
                  <span className={`font-semibold ${isSuccess ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {isSuccess ? 'Paid' : 'Unpaid'}
                  </span>
                </div>
              </div>
            ))}
            <div className="rounded-xl border border-border-default bg-surface-hover/50 p-4">
              <div className="flex justify-between text-base font-bold text-text-primary">
                <span>Total</span>
                <span className="text-text-price">{formatPrice(totalAmount)}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-border-default bg-surface-hover/50 p-6 text-left space-y-4">
            <div className="flex justify-between border-b border-border-default pb-3 text-sm">
              <span className="text-text-secondary">Order ID</span>
              <span className="font-semibold text-text-primary">#{firstOrder.id}</span>
            </div>
            <div className="flex justify-between border-b border-border-default pb-3 text-sm">
              <span className="text-text-secondary">Payment Method</span>
              <span className="font-semibold text-text-primary">
                {PAYMENT_METHOD_LABELS[firstOrder.payment_method]}
              </span>
            </div>
            <div className="flex justify-between border-b border-border-default pb-3 text-sm">
              <span className="text-text-secondary">Payment Status</span>
              <span className={`font-semibold ${isSuccess ? 'text-emerald-600' : 'text-amber-600'}`}>
                {isSuccess ? 'Paid' : 'Unpaid'}
              </span>
            </div>
            <div className="flex justify-between pt-1 text-base font-bold text-text-primary">
              <span>Total Amount</span>
              <span className="text-text-price">{formatPrice(firstOrder.total_amount)}</span>
            </div>
          </div>
        )}

        {/* Action CTAs */}
        <div className="flex flex-col gap-3 sm:flex-row">
          {isSuccess ? (
            <>
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
                onClick={() => orders.length === 1
                  ? navigate(ROUTES.ORDER_DETAIL(firstOrder.id))
                  : navigate(ROUTES.ORDERS)
                }
                className="flex-1 py-3"
                icon={ArrowRight}
              >
                {orders.length === 1 ? 'View Order Details' : 'View My Orders'}
              </Button>
            </>
          ) : (
            <>
              <Button
                type="button"
                variant="brand-outline"
                onClick={() => orders.length === 1
                  ? navigate(ROUTES.ORDER_DETAIL(firstOrder.id))
                  : navigate(ROUTES.ORDERS)
                }
                className="flex-1 py-3"
                icon={ArrowRight}
              >
                {orders.length === 1 ? 'View Order Details' : 'View My Orders'}
              </Button>
              <Button
                type="button"
                variant="brand"
                onClick={handleRetryPayment}
                loading={createPayment.isPending}
                className="flex-1 py-3"
                icon={RefreshCw}
              >
                Retry Payment
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
