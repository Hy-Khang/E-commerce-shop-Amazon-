import { Link } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';
import { ROUTES } from '@/common/constants/routes';
import { formatPrice } from '@/common/utils/format.util';
import type { AiCartSummary } from '../types/ai-chat.types';

interface Props {
  cart: AiCartSummary;
  onNavigate?: () => void;
}

/** "Cart updated" card shown after the agent adds/updates/removes an item. */
export function AiCartUpdateCard({ cart, onNavigate }: Props) {
  return (
    <div className="mt-2 rounded-xl border border-border-default bg-surface p-3">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-text-primary">
        <ShoppingCart className="h-4 w-4 text-text-brand" />
        Cart updated
      </div>

      {cart.items.length === 0 ? (
        <p className="mt-2 text-xs text-text-secondary">Your cart is empty.</p>
      ) : (
        <ul className="mt-2 space-y-1.5">
          {cart.items.slice(0, 4).map((it) => (
            <li key={it.item_id} className="flex items-center justify-between gap-2 text-xs">
              <span className="min-w-0 flex-1 truncate text-text-primary">
                {it.product_name}
                {(it.option1 || it.option2) && (
                  <span className="text-text-muted">
                    {' '}
                    · {[it.option1, it.option2].filter(Boolean).join(' / ')}
                  </span>
                )}
                <span className="text-text-muted"> × {it.quantity}</span>
              </span>
              <span className="flex-shrink-0 font-semibold text-text-primary">
                {formatPrice(it.line_total)}
              </span>
            </li>
          ))}
          {cart.items.length > 4 && (
            <li className="text-xs text-text-muted">
              …and {cart.items.length - 4} more items
            </li>
          )}
        </ul>
      )}

      <div className="mt-2 flex items-center justify-between border-t border-border-default pt-2">
        <span className="text-xs text-text-secondary">Subtotal</span>
        <span className="text-sm font-bold text-text-primary">
          {formatPrice(cart.subtotal)}
        </span>
      </div>

      <Link
        to={ROUTES.CART}
        onClick={onNavigate}
        className="mt-2 block rounded-lg border border-border-brand px-3 py-1.5 text-center text-xs font-semibold text-text-brand transition-colors hover:bg-brand-light"
      >
        View cart
      </Link>
    </div>
  );
}
