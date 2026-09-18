import { useState } from 'react';
import { Sparkles, Tag, Ticket, X } from 'lucide-react';
import { useTranslation, Trans } from 'react-i18next';
import type { TFunction } from 'i18next';
import { formatPrice } from '@/common/utils/format.util';
import {
  CouponSelectorModal,
  optionToValidation,
  type AppliedCouponEntry,
  type CouponOption,
  type CouponValidationResult,
} from '@/features/coupon';
import type { VoucherSuggestions } from '../utils/voucher-suggestion.util';

interface Props {
  cartSig: string;
  applied: AppliedCouponEntry[];
  suggestions: VoucherSuggestions;
  previewLoading?: boolean;
  previewError?: boolean;
  onApply: (code: string, validation: CouponValidationResult) => void;
  onRemove: (code: string) => void;
}

function discountLabel(o: CouponOption, t: TFunction<'aiChat'>): string {
  if (o.discount_type === 'percentage') {
    const cap = o.max_discount_amount
      ? formatPrice(o.max_discount_amount)
      : null;
    return cap
      ? t('checkoutVoucher.offPercentCap', { value: o.discount_value, cap })
      : t('checkoutVoucher.offPercent', { value: o.discount_value });
  }
  return t('checkoutVoucher.offFlat', { value: formatPrice(o.discount_value) });
}

/**
 * Voucher section for the AI mini-checkout. Reuses the storefront's Shopee-style
 * picker (`CouponSelectorModal`) instead of a raw code field, and proactively
 * surfaces the best eligible voucher (one-tap apply) plus the nearest next-tier
 * voucher ("spend X more to unlock"). Applied codes render as removable chips;
 * every change bubbles up so the parent re-previews the totals.
 */
export function AiCheckoutVoucher({
  cartSig,
  applied,
  suggestions,
  previewLoading,
  previewError,
  onApply,
  onRemove,
}: Props) {
  const { t } = useTranslation('aiChat');
  const [open, setOpen] = useState(false);
  const { best, nextTier } = suggestions;

  return (
    <div className="mt-3">
      <p className="mb-1 flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-text-muted">
        <Tag className="h-3 w-3" /> {t('checkoutVoucher.title')}
      </p>

      {/* Applied vouchers */}
      {applied.length > 0 && (
        <div className="mb-1.5 flex flex-wrap gap-1.5">
          {applied.map((e) => (
            <span
              key={e.code}
              className="inline-flex items-center gap-1 rounded-full border border-border-brand bg-brand-light px-2 py-0.5 text-[11px] font-medium text-text-brand"
            >
              {e.code}
              <button
                type="button"
                onClick={() => onRemove(e.code)}
                aria-label={t('checkoutVoucher.remove', { code: e.code })}
                className="text-text-brand/70 hover:text-text-brand"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Proactive suggestions: best eligible (tap to apply) + next tier teaser */}
      {(best || nextTier) && (
        <div className="mb-1.5 space-y-1.5">
          {best && (
            <button
              type="button"
              onClick={() => onApply(best.code, optionToValidation(best))}
              disabled={previewLoading}
              className="flex w-full items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-left transition-colors hover:border-emerald-300 disabled:pointer-events-none disabled:opacity-50 dark:border-emerald-400/20 dark:bg-emerald-500/10"
            >
              <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
              <span className="min-w-0 flex-1 text-[11px] leading-snug">
                <span className="font-semibold text-emerald-800 dark:text-emerald-300">
                  {best.code}
                </span>{' '}
                <span className="text-emerald-700 dark:text-emerald-400">
                  — {discountLabel(best, t)}
                </span>
                {best.discount_preview > 0 && (
                  <span className="block text-emerald-700/90 dark:text-emerald-400/90">
                    {t('checkoutVoucher.saveAmount', { amount: formatPrice(best.discount_preview) })}
                  </span>
                )}
              </span>
            </button>
          )}
          {nextTier && (
            <div className="flex items-start gap-2 rounded-lg border border-dashed border-border-strong bg-surface px-2.5 py-1.5 text-[11px] leading-snug text-text-secondary">
              <Ticket className="mt-0.5 h-3.5 w-3.5 shrink-0 text-text-muted" />
              <span className="min-w-0 flex-1">
                <Trans
                  i18nKey="checkoutVoucher.spendMore"
                  t={t}
                  values={{
                    amount: formatPrice(nextTier.short_of_min ?? 0),
                    code: nextTier.code,
                    discount: discountLabel(nextTier, t)
                  }}
                  components={{
                    1: <span className="font-semibold text-text-primary" />,
                    2: <span className="font-semibold text-text-brand" />
                  }}
                />
              </span>
            </div>
          )}
        </div>
      )}

      {/* Picker trigger — opens the same voucher modal as the real checkout */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-border-strong bg-surface py-1.5 text-xs font-medium text-text-secondary transition-colors hover:border-border-brand hover:text-text-brand"
      >
        <Ticket className="h-3.5 w-3.5" />
        {applied.length > 0 ? t('checkoutVoucher.changeVoucher') : t('checkoutVoucher.selectVoucher')}
      </button>

      {previewLoading && (
        <p className="mt-1 text-[11px] text-text-muted">{t('checkoutVoucher.updating')}</p>
      )}
      {previewError && (
        <p className="mt-1 text-[11px] text-rose-600">
          {t('checkoutVoucher.error')}
        </p>
      )}

      <CouponSelectorModal
        open={open}
        onClose={() => setOpen(false)}
        appliedCoupons={applied}
        onApply={onApply}
        onRemove={onRemove}
        cartSig={cartSig}
      />
    </div>
  );
}
