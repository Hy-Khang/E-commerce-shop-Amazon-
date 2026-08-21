import { Check, Ticket } from 'lucide-react';
import { formatPrice } from '@/common/utils/format.util';
import type { CouponOption } from '../types/coupon.types';

interface Props {
  option: CouponOption;
  selected: boolean;
  onToggle: (option: CouponOption) => void;
}

function discountLabel(o: CouponOption): string {
  if (o.discount_type === 'percentage') {
    const cap = o.max_discount_amount
      ? ` (up to ${formatPrice(o.max_discount_amount)})`
      : '';
    return `${o.discount_value}% off${cap}`;
  }
  return `${formatPrice(o.discount_value)} off`;
}

function ineligibleText(o: CouponOption): string {
  switch (o.reason) {
    case 'below_min':
      return o.short_of_min != null
        ? `Add ${formatPrice(o.short_of_min)} more to use`
        : 'Order does not meet the minimum';
    case 'no_applicable_items':
      return 'No applicable items in your cart';
    case 'user_limit':
      return "You've already used this voucher";
    default:
      return 'Not available';
  }
}

/** A single selectable voucher row inside the picker (radio-style toggle). */
export function CouponOptionRow({ option, selected, onToggle }: Props) {
  // A currently-selected voucher stays clickable so it can always be deselected,
  // even if the cart changed and it is no longer eligible.
  const disabled = !option.eligible && !selected;
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onToggle(option)}
      aria-pressed={selected}
      className={`flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors ${
        disabled
          ? 'cursor-not-allowed border-border-default bg-neutral-50 opacity-60'
          : selected
            ? 'border-brand bg-brand-light/30 ring-1 ring-brand/20'
            : 'border-border-default bg-white hover:border-border-strong'
      }`}
    >
      <Ticket
        className={`h-5 w-5 shrink-0 ${disabled ? 'text-text-muted' : 'text-brand'}`}
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-semibold text-text-primary">
            {option.code}
          </span>
          <span className="shrink-0 text-xs font-medium text-emerald-700">
            {discountLabel(option)}
          </span>
        </div>
        {option.description && (
          <p className="truncate text-xs text-text-secondary">
            {option.description}
          </p>
        )}
        {option.min_order_amount != null && (
          <p className="text-[11px] text-text-muted">
            Min order {formatPrice(option.min_order_amount)}
          </p>
        )}
        {disabled ? (
          <p className="text-[11px] font-medium text-error-600">
            {ineligibleText(option)}
          </p>
        ) : (
          option.discount_preview > 0 && (
            <p className="text-[11px] font-medium text-emerald-700">
              You save {formatPrice(option.discount_preview)}
            </p>
          )
        )}
      </div>
      <span
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
          selected
            ? 'border-brand bg-brand text-white'
            : 'border-border-strong bg-white'
        }`}
      >
        {selected && <Check className="h-3.5 w-3.5" />}
      </span>
    </button>
  );
}
