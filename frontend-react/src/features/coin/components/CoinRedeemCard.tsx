import { Coins } from 'lucide-react';
import { formatPrice } from '@/common/utils/format.util';

interface CoinRedeemCardProps {
  /** Spendable Xu balance. */
  balance: number;
  /** Max Xu redeemable on this order (min of balance and 50% of items total). */
  max: number;
  /** Current selection. */
  coins: number;
  onChange: (coins: number) => void;
  /** Xu actually applied by the preview — shown when it differs from the pick. */
  applied?: number;
}

/**
 * Checkout card to redeem Xu (Hoàn Xu). A toggle enables redemption; the input +
 * "Use max" are bounded by the per-order cap (50% of items) and the balance.
 */
export function CoinRedeemCard({
  balance,
  max,
  coins,
  onChange,
  applied,
}: CoinRedeemCardProps) {
  const enabled = coins > 0;
  const canRedeem = max > 0;

  const clamp = (n: number) => Math.max(0, Math.min(max, Math.trunc(n || 0)));

  return (
    <div className="rounded-xl border border-border-default bg-elevated p-6">
      <div className="mb-4 flex items-center gap-2">
        <Coins className="h-5 w-5 text-amber-500" />
        <h2 className="text-lg font-semibold text-text-primary">Use Coins</h2>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-text-secondary">
            Balance:{' '}
            <span className="font-semibold text-text-primary">
              {balance.toLocaleString('vi-VN')} Coins
            </span>
          </p>
          <p className="mt-0.5 text-xs text-text-muted">
            1 Coin = 1 ₫ · up to {max.toLocaleString('vi-VN')} Coins on this order
          </p>
        </div>

        <label className="inline-flex cursor-pointer items-center">
          <input
            type="checkbox"
            className="peer sr-only"
            checked={enabled}
            disabled={!canRedeem}
            onChange={(e) => onChange(e.target.checked ? max : 0)}
          />
          <span className="relative h-6 w-11 rounded-full bg-neutral-300 transition-colors peer-checked:bg-brand peer-disabled:opacity-50 after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-transform peer-checked:after:translate-x-5" />
        </label>
      </div>

      {enabled && (
        <div className="mt-4 flex items-center gap-3">
          <input
            type="number"
            min={0}
            max={max}
            step={1}
            value={coins}
            onChange={(e) => onChange(clamp(Number(e.target.value)))}
            className="w-40 rounded-lg border border-border-default bg-white px-3 py-2 text-sm text-text-primary focus:border-border-brand focus:ring-2 focus:ring-ring-focus/20 focus:outline-none"
          />
          <span className="text-sm text-text-secondary">
            = -{formatPrice(coins)}
          </span>
          <button
            type="button"
            onClick={() => onChange(max)}
            className="ml-auto rounded-lg border border-border-brand px-3 py-1.5 text-xs font-semibold text-text-brand transition-colors hover:bg-brand-light"
          >
            Use max
          </button>
        </div>
      )}

      {!canRedeem && (
        <p className="mt-3 text-xs text-text-muted">
          {balance <= 0
            ? 'You have no Coins to redeem yet.'
            : 'This order is not eligible for Coins redemption.'}
        </p>
      )}

      {enabled && applied !== undefined && applied < coins && (
        <p className="mt-3 text-xs text-amber-600">
          Only {applied.toLocaleString('vi-VN')} Coins can be applied to this order
          (a coupon leaves less room). The rest stays in your balance.
        </p>
      )}
    </div>
  );
}
