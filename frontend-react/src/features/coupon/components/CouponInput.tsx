import { useState } from 'react';
import { Tag, X, Loader2, Check } from 'lucide-react';
import { formatPrice } from '@/common/utils/format.util';
import { ApiError } from '@/core/api/api.types';
import { useValidateCoupon } from '../hooks/useValidateCoupon';
import type { CouponValidationResult } from '../types/coupon.types';

interface Props {
  onApply: (code: string, validation: CouponValidationResult) => void;
  onRemove: () => void;
  appliedCode: string | null;
}

const SCOPE_LABELS: Record<string, string> = {
  all: 'Entire order',
  categories: 'Selected categories',
  products: 'Selected products',
};

export function CouponInput({ onApply, onRemove, appliedCode }: Props) {
  const [code, setCode] = useState('');
  const validate = useValidateCoupon();

  function handleApply() {
    const trimmed = code.trim();
    if (!trimmed) return;

    validate.mutate(trimmed, {
      onSuccess: (result) => {
        onApply(trimmed.toUpperCase(), result);
        setCode('');
      },
    });
  }

  function handleRemove() {
    onRemove();
    validate.reset();
  }

  if (appliedCode) {
    return (
      <div className="flex items-center justify-between rounded-md border border-green-200 bg-green-50 px-3 py-2">
        <div className="flex items-center gap-2">
          <Check className="h-4 w-4 text-green-600" />
          <span className="text-sm font-medium text-green-800">{appliedCode}</span>
        </div>
        <button
          type="button"
          onClick={handleRemove}
          className="rounded p-0.5 text-green-600 hover:bg-green-100 hover:text-green-800"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Tag className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleApply())}
            placeholder="Enter coupon code"
            className="w-full rounded-lg border border-border-default py-2 pl-9 pr-3 text-sm uppercase placeholder:normal-case focus:border-border-brand focus:outline-none focus:ring-1 focus:ring-brand bg-white transition-colors"
          />
        </div>
        <button
          type="button"
          onClick={handleApply}
          disabled={validate.isPending || !code.trim()}
          className="flex items-center gap-1.5 rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {validate.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          Apply
        </button>
      </div>

      {validate.isError && (
        <p className="text-xs text-red-600">
          {validate.error instanceof ApiError ? validate.error.message : 'Invalid coupon code'}
        </p>
      )}

      {validate.isSuccess && validate.data && (
        <div className="rounded-lg bg-brand-light px-3 py-2.5 text-xs text-text-brand border border-brand/10">
          <p className="font-semibold">
            {validate.data.discount_type === 'percentage'
              ? `${validate.data.discount_value}% off`
              : `${formatPrice(validate.data.discount_value)} off`}
            {validate.data.max_discount_amount && ` (max ${formatPrice(validate.data.max_discount_amount)})`}
          </p>
          <p className="mt-0.5 text-text-brand/80">
            Applies to: {SCOPE_LABELS[validate.data.scope]}
            {validate.data.min_order_amount && ` | Min: ${formatPrice(validate.data.min_order_amount)}`}
          </p>
        </div>
      )}
    </div>
  );
}
