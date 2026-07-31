import { Link } from 'react-router-dom';
import { Store } from 'lucide-react';
import { formatPrice, formatDate, getImageUrl } from '@/common/utils/format.util';
import { ROUTES, PAYMENT_METHOD_LABELS } from '@/common/constants/routes';
import type { OrderListItemWithItems } from '../types/order.types';
import { OrderStatusBadge } from './OrderStatusBadge';

const MAX_VISIBLE_ITEMS = 3;

interface Props {
  order: OrderListItemWithItems;
}

export function OrderCard({ order }: Props) {
  const items = order.order_items;
  const visibleItems = items.slice(0, MAX_VISIBLE_ITEMS);
  const hiddenCount = items.length - MAX_VISIBLE_ITEMS;

  return (
    <Link
      to={ROUTES.ORDER_DETAIL(order.id)}
      className="shop-card block p-4 transition-all hover:border-border-strong hover:shadow-sm"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div>
            <p className="text-sm font-semibold text-text-primary">Order #{order.id}</p>
            <p className="mt-0.5 text-xs text-text-muted">{formatDate(order.created_at)}</p>
          </div>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      {/* Shop header */}
      {order.shop_name && (
        <div className="mt-2 flex items-center gap-1.5">
          <Store className="h-3.5 w-3.5 text-text-muted" />
          <span className="text-xs font-semibold text-text-secondary">{order.shop_name}</span>
        </div>
      )}

      {visibleItems.length > 0 && (
        <div className="mt-3 space-y-2">
          {visibleItems.map((item) => (
            <div key={item.id} className="flex items-center gap-3">
              <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg border border-border-default bg-neutral-50">
                {item.thumbnail_url ? (
                  <img
                    src={getImageUrl(item.thumbnail_url)}
                    alt={item.product_name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs text-text-muted">
                    N/A
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-text-primary">
                  {item.product_name}
                </p>
                {(item.variant_option1_value || item.variant_option2_value) && (
                  <p className="text-xs text-text-muted">
                    {[
                      item.variant_option1_label && item.variant_option1_value
                        ? `${item.variant_option1_label}: ${item.variant_option1_value}`
                        : null,
                      item.variant_option2_label && item.variant_option2_value
                        ? `${item.variant_option2_label}: ${item.variant_option2_value}`
                        : null,
                    ]
                      .filter(Boolean)
                      .join(', ')}
                  </p>
                )}
              </div>
              <div className="flex-shrink-0 text-right">
                <p className="text-sm text-text-secondary">x{item.quantity}</p>
                <p className="text-sm font-bold text-text-primary">
                  {formatPrice(item.price)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {hiddenCount > 0 && (
        <p className="mt-2 text-xs text-text-brand">+{hiddenCount} more items</p>
      )}

      <div className="mt-3 flex items-center justify-between border-t border-border-default pt-3">
        <span className="text-xs text-text-muted">
          {PAYMENT_METHOD_LABELS[order.payment_method]}
        </span>
        <span className="text-sm font-bold text-text-primary">
          {formatPrice(order.total_amount)}
        </span>
      </div>
    </Link>
  );
}
