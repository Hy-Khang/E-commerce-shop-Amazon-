import { useState } from 'react';
import { Check, Ticket, X } from 'lucide-react';
import { CouponSelectorModal } from './CouponSelectorModal';
import type {
  AppliedCouponEntry,
  CouponValidationResult,
} from '../types/coupon.types';

interface Props {
  appliedCoupons: AppliedCouponEntry[];
  onApply: (code: string, validation: CouponValidationResult) => void;
  onRemove: (code: string) => void;
  /** Cart signature — keys the availability query so it refetches with the cart. */
  cartSig: string;
}

function groupLabel(v: CouponValidationResult): string {
  return v.shop_id != null ? 'Shop coupon' : 'Platform coupon';
}

/**
 * Checkout coupon entry point — a Shopee-style trigger that opens the voucher
 * picker (browse eligible platform + shop vouchers, or enter a code). Shows the
 * currently applied coupons as removable rows. Drop-in for `CouponInput`: same
 * `appliedCoupons` / `onApply` / `onRemove` contract, plus `cartSig`.
 */
export function CouponPicker({
  appliedCoupons,
  onApply,
  onRemove,
  cartSig,
}: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-3">
      {appliedCoupons.length > 0 && (
        <ul className="space-y-2">
          {appliedCoupons.map(({ code, validation }) => (
            <li
              key={code}
              className="flex items-center justify-between rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 dark:border-emerald-400/20 dark:bg-emerald-500/15"
            >
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-700 dark:text-emerald-400" />
                <span className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
                  {code}
                </span>
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">
                  {groupLabel(validation)}
                </span>
              </div>
              <button
                type="button"
                onClick={() => onRemove(code)}
                className="rounded p-0.5 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800 dark:text-emerald-400 dark:hover:bg-emerald-500/20 dark:hover:text-emerald-300"
                aria-label={`Remove coupon ${code}`}
              >
                <X className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border-strong bg-surface py-2.5 text-sm font-medium text-text-secondary transition-colors hover:border-border-brand hover:text-text-brand"
      >
        <Ticket className="h-4 w-4" />
        {appliedCoupons.length > 0 ? 'Add or change vouchers' : 'Select or enter voucher'}
      </button>

      <p className="text-xs text-text-muted">
        You can stack one platform coupon with one coupon per shop.
      </p>

      <CouponSelectorModal
        open={open}
        onClose={() => setOpen(false)}
        appliedCoupons={appliedCoupons}
        onApply={onApply}
        onRemove={onRemove}
        cartSig={cartSig}
      />
    </div>
  );
}
