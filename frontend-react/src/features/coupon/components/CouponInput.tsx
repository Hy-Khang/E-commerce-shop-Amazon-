import { useState } from 'react';
import { Tag, X, Loader2, Check } from 'lucide-react';
import { ApiError } from '@/core/api/api.types';
import { useValidateCoupon } from '../hooks/useValidateCoupon';
import type { AppliedCouponEntry, CouponValidationResult } from '../types/coupon.types';

interface Props {
  appliedCoupons: AppliedCouponEntry[];
  onApply: (code: string, validation: CouponValidationResult) => void;
  onRemove: (code: string) => void;
}

function groupKey(v: CouponValidationResult): string {
  return v.shop_id != null ? `shop:${v.shop_id}` : 'platform';
}

function groupLabel(v: CouponValidationResult): string {
  return v.shop_id != null ? 'Shop coupon' : 'Platform coupon';
}

export function CouponInput({ appliedCoupons, onApply, onRemove }: Props) {
  const [code, setCode] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const validate = useValidateCoupon();

  function handleApply() {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) return;
    setLocalError(null);

    if (appliedCoupons.some((c) => c.code === trimmed)) {
      setLocalError('This coupon is already applied.');
      return;
    }

    validate.mutate(trimmed, {
      onSuccess: (result) => {
        // Enforce the multi-coupon rule on the client: ≤1 platform + ≤1 per shop.
        const key = groupKey(result);
        const clash = appliedCoupons.find((c) => groupKey(c.validation) === key);
        if (clash) {
          setLocalError(
            result.shop_id != null
              ? 'You already applied a coupon for this shop.'
              : 'Only one platform coupon can be applied.',
          );
          return;
        }
        onApply(trimmed, result);
        setCode('');
      },
    });
  }

  return (
    <div className="space-y-3">
      {appliedCoupons.length > 0 && (
        <ul className="space-y-2">
          {appliedCoupons.map(({ code: applied, validation }) => (
            <li
              key={applied}
              className="flex items-center justify-between rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 dark:border-emerald-400/20 dark:bg-emerald-500/15"
            >
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-700 dark:text-emerald-400" />
                <span className="text-sm font-medium text-emerald-800 dark:text-emerald-300">{applied}</span>
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">
                  {groupLabel(validation)}
                </span>
              </div>
              <button
                type="button"
                onClick={() => onRemove(applied)}
                className="rounded p-0.5 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800 dark:text-emerald-400 dark:hover:bg-emerald-500/20 dark:hover:text-emerald-300"
                aria-label={`Remove coupon ${applied}`}
              >
                <X className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Tag className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            value={code}
            onChange={(e) => {
              setCode(e.target.value);
              setLocalError(null);
            }}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleApply())}
            placeholder="Enter coupon code"
            className="w-full rounded-lg border border-border-default py-2 pl-9 pr-3 text-sm uppercase placeholder:normal-case focus:border-border-brand focus:outline-none focus:ring-1 focus:ring-brand bg-surface transition-colors"
          />
        </div>
        <button
          type="button"
          onClick={handleApply}
          disabled={validate.isPending || !code.trim()}
          className="flex items-center gap-1.5 rounded-md bg-neutral-100 px-4 py-2 text-sm font-medium text-text-secondary hover:bg-neutral-200 dark:bg-neutral-700 dark:hover:bg-neutral-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {validate.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          Apply
        </button>
      </div>

      <p className="text-xs text-text-muted">
        You can stack one platform coupon with one coupon per shop.
      </p>

      {localError && <p className="text-xs text-error-600">{localError}</p>}

      {validate.isError && !localError && (
        <p className="text-xs text-error-600">
          {validate.error instanceof ApiError ? validate.error.message : 'Invalid coupon code'}
        </p>
      )}
    </div>
  );
}
