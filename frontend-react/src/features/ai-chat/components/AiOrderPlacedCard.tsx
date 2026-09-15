import { Link } from 'react-router-dom';
import { CheckCircle2, Clock, ShoppingBag } from 'lucide-react';
import { ROUTES } from '@/common/constants/routes';
import type { AiOrderPlaced } from '../types/ai-chat.types';

interface Props {
  order: AiOrderPlaced;
  onNavigate?: () => void;
  onPickSuggestion?: (text: string) => void;
}

/**
 * Replaces the checkout proposal once the customer confirms — a clear success
 * notification plus "what next?" actions (view orders / keep shopping), so the
 * chat guides the shopper forward instead of leaving a stale confirm form.
 */
export function AiOrderPlacedCard({ order, onNavigate, onPickSuggestion }: Props) {
  const isOnline = order.payment_method !== 'cod';

  return (
    <div className="mt-2 rounded-xl border border-emerald-200 bg-emerald-50/60 p-3">
      <div className="flex items-center gap-1.5 text-sm font-semibold text-emerald-700">
        <CheckCircle2 className="h-4 w-4" />
        Order placed successfully!
      </div>

      <p className="mt-1 text-xs text-text-secondary">
        Order code:{' '}
        <span className="font-mono text-text-primary">
          {order.order_group_id.slice(0, 8)}
        </span>
      </p>

      {isOnline && (
        <p className="mt-1 flex items-center gap-1 text-xs text-amber-700">
          <Clock className="h-3.5 w-3.5" />
          Complete the payment to confirm your order.
        </p>
      )}

      <p className="mt-3 text-xs font-medium text-text-primary">
        What would you like to do next?
      </p>
      <div className="mt-2 space-y-1.5">
        <Link
          to={ROUTES.ORDERS}
          onClick={onNavigate}
          className="flex items-center justify-center gap-1.5 rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-brand-hover"
        >
          <ShoppingBag className="h-3.5 w-3.5" /> View my orders
        </Link>
        {onPickSuggestion && (
          <button
            type="button"
            onClick={() => onPickSuggestion('Suggest some products for me')}
            className="w-full rounded-lg border border-border-brand px-3 py-1.5 text-xs font-semibold text-text-brand transition-colors hover:bg-brand-light"
          >
            Keep shopping
          </button>
        )}
      </div>
    </div>
  );
}
