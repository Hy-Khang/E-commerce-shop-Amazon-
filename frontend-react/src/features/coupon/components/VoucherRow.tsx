import { Ticket, Check, X } from 'lucide-react';
import { formatPrice } from '@/common/utils/format.util';
import type { AppliedCouponEntry } from '../types/coupon.types';

interface Props {
  /** The voucher currently applied to this group, if any. */
  applied?: AppliedCouponEntry;
  /** Label for the empty-state select button, e.g. "Select shop voucher". */
  selectLabel: string;
  /** Show the "X% off" / "₫ off" hint next to the code (shop rows do, platform doesn't). */
  showDiscountLabel?: boolean;
  /** Open the picker for this group. */
  onOpen: () => void;
  onRemove: (code: string) => void;
}

/**
 * One voucher slot for a coupon group (platform or a single shop): either the
 * applied coupon (with Change / remove) or a dashed "select" button. Shared by
 * the Cart page (shop rows + platform row) and the Checkout page so both read
 * identically. Own brand/amber theme — marketplace layout, not a clone.
 */
export function VoucherRow({
  applied,
  selectLabel,
  showDiscountLabel = false,
  onOpen,
  onRemove,
}: Props) {
  if (applied) {
    return (
      <div className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 dark:border-emerald-400/20 dark:bg-emerald-500/15">
        <span className="flex items-center gap-2 text-sm font-medium text-emerald-800 dark:text-emerald-300">
          <Check className="h-4 w-4 text-emerald-700 dark:text-emerald-400" />
          {applied.code}
          {showDiscountLabel &&
            (applied.validation.discount_type === 'percentage' ? (
              <span className="text-xs font-normal text-emerald-700 dark:text-emerald-400">
                {applied.validation.discount_value}% off
              </span>
            ) : (
              <span className="text-xs font-normal text-emerald-700 dark:text-emerald-400">
                {formatPrice(applied.validation.discount_value)} off
              </span>
            ))}
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onOpen}
            className="rounded px-2 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/20"
          >
            Change
          </button>
          <button
            type="button"
            onClick={() => onRemove(applied.code)}
            className="rounded p-0.5 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/20"
            aria-label={`Remove voucher ${applied.code}`}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border-strong bg-surface py-2 text-sm font-medium text-text-secondary transition-colors hover:border-border-brand hover:text-text-brand"
    >
      <Ticket className="h-4 w-4" />
      {selectLabel}
    </button>
  );
}
