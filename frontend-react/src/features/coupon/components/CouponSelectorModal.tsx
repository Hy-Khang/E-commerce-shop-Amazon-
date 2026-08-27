import { useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import { X, Tag, Loader2, Check } from 'lucide-react';
import { ApiError } from '@/core/api/api.types';
import { useValidateCoupon } from '../hooks/useValidateCoupon';
import { useAvailableCoupons } from '../hooks/useAvailableCoupons';
import { optionToValidation } from '../utils/coupon.util';
import { CouponOptionRow } from './CouponOptionRow';
import type {
  AppliedCouponEntry,
  CouponOption,
  CouponValidationResult,
} from '../types/coupon.types';

interface Props {
  open: boolean;
  onClose: () => void;
  appliedCoupons: AppliedCouponEntry[];
  onApply: (code: string, validation: CouponValidationResult) => void;
  onRemove: (code: string) => void;
  cartSig: string;
  /**
   * Which coupon groups to show/allow. `'all'` (default) = platform + every
   * shop (checkout behaviour). `'platform'` = platform vouchers only.
   * A `shopId` number = only that shop's vouchers. The draft is always seeded
   * from the FULL applied set, so coupons in hidden groups are preserved.
   */
  scope?: 'all' | 'platform' | number;
  /** Optional heading override (e.g. "Shop voucher", "Platform voucher"). */
  title?: string;
}

function groupKey(shopId: number | null | undefined): string {
  return shopId != null ? `shop:${shopId}` : 'platform';
}

/** The group a coupon belongs to, keyed the same way `scope` is expressed. */
function scopeGroup(shopId: number | null | undefined): 'platform' | number {
  return shopId != null ? shopId : 'platform';
}

/**
 * Shopee-style voucher picker. Lists platform + per-shop coupons available for
 * the current cart (from `GET /coupons/available`) with per-coupon eligibility,
 * plus a manual-entry fallback for hidden codes. Edits a local draft seeded from
 * the applied set; "Apply" commits the diff via onApply/onRemove. At most one
 * coupon per group (platform / each shop).
 */
export function CouponSelectorModal({
  open,
  onClose,
  appliedCoupons,
  onApply,
  onRemove,
  cartSig,
  scope = 'all',
  title,
}: Props) {
  const { data, isLoading, isError } = useAvailableCoupons(cartSig, open);
  const validate = useValidateCoupon();

  // Whether a coupon's group is in scope for this modal instance.
  const inScope = (shopId: number | null | undefined): boolean =>
    scope === 'all' || scopeGroup(shopId) === scope;

  const [draft, setDraft] = useState<AppliedCouponEntry[]>([]);
  const [code, setCode] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  // Seed the draft from the applied set each time the modal opens. Adjust state
  // during render (React docs: "storing info from previous renders") so it only
  // re-seeds on the open transition, not on every applied-set change. `prevOpen`
  // starts `false` so a component mounted already-open still seeds on first render.
  const [prevOpen, setPrevOpen] = useState(false);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setDraft(appliedCoupons);
      setCode('');
      setLocalError(null);
    }
  }

  function selectOption(option: CouponOption) {
    const key = groupKey(option.shop_id);
    setDraft((prev) => {
      const existing = prev.find((c) => c.code === option.code);
      // Toggle off if the same code is clicked again.
      if (existing) return prev.filter((c) => c.code !== option.code);
      // ≤1 per group: drop any other coupon in the same group, then add.
      const withoutGroup = prev.filter(
        (c) => groupKey(c.validation.shop_id) !== key,
      );
      return [
        ...withoutGroup,
        { code: option.code, validation: optionToValidation(option) },
      ];
    });
  }

  function handleManualApply() {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) return;
    setLocalError(null);
    if (draft.some((c) => c.code === trimmed)) {
      setLocalError('This coupon is already selected.');
      return;
    }
    validate.mutate(trimmed, {
      onSuccess: (result) => {
        // Reject a code that belongs to a different group than this scoped modal.
        if (!inScope(result.shop_id)) {
          setLocalError('This code does not apply to the selected section.');
          return;
        }
        const key = groupKey(result.shop_id);
        setDraft((prev) => [
          ...prev.filter((c) => groupKey(c.validation.shop_id) !== key),
          { code: trimmed, validation: result },
        ]);
        setCode('');
      },
    });
  }

  function removeFromDraft(target: string) {
    setDraft((prev) => prev.filter((c) => c.code !== target));
  }

  function handleApply() {
    const draftCodes = new Set(draft.map((c) => c.code));
    const appliedCodes = new Set(appliedCoupons.map((c) => c.code));
    // Remove coupons no longer in the draft.
    for (const applied of appliedCoupons) {
      if (!draftCodes.has(applied.code)) onRemove(applied.code);
    }
    // Add coupons newly in the draft.
    for (const entry of draft) {
      if (!appliedCodes.has(entry.code)) onApply(entry.code, entry.validation);
    }
    onClose();
  }

  const selectedCodes = new Set(draft.map((c) => c.code));
  // Draft entries with no matching listed option → hidden/manual coupons.
  const listedCodes = new Set<string>([
    ...(data?.platform ?? []).map((o) => o.code),
    ...(data?.shops ?? []).flatMap((s) => s.coupons.map((o) => o.code)),
  ]);
  // Only surface manual coupons that belong to this modal's scope.
  const manualSelected = draft.filter(
    (c) => !listedCodes.has(c.code) && inScope(c.validation.shop_id),
  );

  // Sections visible for the current scope.
  const showPlatform = scope === 'all' || scope === 'platform';
  const visibleShops = (data?.shops ?? []).filter(
    (s) => scope === 'all' || scope === s.shop_id,
  );
  const hasCatalog =
    (showPlatform && (data?.platform.length ?? 0) > 0) ||
    visibleShops.length > 0;

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
          <motion.div
            className="absolute inset-0 bg-black/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="relative z-10 flex max-h-[85vh] w-full max-w-md flex-col rounded-2xl bg-elevated shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-border-default px-5 py-4">
              <div className="flex items-center gap-2.5">
                <Tag className="h-5 w-5 text-brand" />
                <h2 className="text-lg font-semibold text-text-primary">
                  {title ?? 'Select Vouchers'}
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-1.5 text-text-secondary transition-colors hover:bg-surface-hover"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Manual entry */}
            <div className="border-b border-border-default px-5 py-3">
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
                    onKeyDown={(e) =>
                      e.key === 'Enter' &&
                      (e.preventDefault(), handleManualApply())
                    }
                    placeholder="Enter voucher code"
                    className="w-full rounded-lg border border-border-default bg-surface py-2 pl-9 pr-3 text-sm uppercase transition-colors placeholder:normal-case focus:border-border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleManualApply}
                  disabled={validate.isPending || !code.trim()}
                  aria-label="Apply code"
                  className="flex items-center gap-1.5 rounded-md bg-neutral-100 px-4 py-2 text-sm font-medium text-text-secondary hover:bg-neutral-200 dark:bg-neutral-700 dark:hover:bg-neutral-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {validate.isPending && (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  )}
                  Apply
                </button>
              </div>
              {localError && (
                <p className="mt-1.5 text-xs text-error-600">{localError}</p>
              )}
              {validate.isError && !localError && (
                <p className="mt-1.5 text-xs text-error-600">
                  {validate.error instanceof ApiError
                    ? validate.error.message
                    : 'Invalid voucher code'}
                </p>
              )}
            </div>

            {/* Catalog */}
            <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
              {/* Gated on !isLoading: until the catalog resolves we can't tell a
                  genuinely-hidden code from one that's simply still loading. */}
              {!isLoading && manualSelected.length > 0 && (
                <section className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                    Applied (manual)
                  </p>
                  {manualSelected.map((c) => (
                    <div
                      key={c.code}
                      className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 dark:border-emerald-400/20 dark:bg-emerald-500/15"
                    >
                      <span className="flex items-center gap-2 text-sm font-medium text-emerald-800 dark:text-emerald-300">
                        <Check className="h-4 w-4 text-emerald-700 dark:text-emerald-400" />
                        {c.code}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeFromDraft(c.code)}
                        className="rounded p-0.5 text-emerald-700 hover:bg-emerald-100 dark:text-emerald-400 dark:hover:bg-emerald-500/20"
                        aria-label={`Remove voucher ${c.code}`}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </section>
              )}

              {isLoading && (
                <div className="flex justify-center py-10">
                  <Loader2 className="h-6 w-6 animate-spin text-text-muted" />
                </div>
              )}

              {isError && !isLoading && (
                <p className="py-6 text-center text-sm text-text-muted">
                  Could not load vouchers. You can still enter a code above.
                </p>
              )}

              {!isLoading && !isError && data && (
                <>
                  {showPlatform && data.platform.length > 0 && (
                    <section className="space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                        Platform vouchers
                      </p>
                      {data.platform.map((o) => (
                        <CouponOptionRow
                          key={o.code}
                          option={o}
                          selected={selectedCodes.has(o.code)}
                          onToggle={selectOption}
                        />
                      ))}
                    </section>
                  )}

                  {visibleShops.map((shop) => (
                    <section key={shop.shop_id} className="space-y-2">
                      <p className="truncate text-xs font-semibold uppercase tracking-wider text-text-muted">
                        {shop.shop_name}
                      </p>
                      {shop.coupons.map((o) => (
                        <CouponOptionRow
                          key={o.code}
                          option={o}
                          selected={selectedCodes.has(o.code)}
                          onToggle={selectOption}
                        />
                      ))}
                    </section>
                  ))}

                  {!hasCatalog && manualSelected.length === 0 && (
                    <p className="py-6 text-center text-sm text-text-muted">
                      No vouchers available for your cart. You can enter a code
                      above.
                    </p>
                  )}
                </>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between gap-3 border-t border-border-default px-5 py-3">
              <span className="text-xs text-text-muted">
                {draft.length} selected
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg border border-border-default px-4 py-2 text-sm font-medium text-text-secondary hover:bg-surface-hover"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleApply}
                  className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-hover"
                >
                  Apply
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
