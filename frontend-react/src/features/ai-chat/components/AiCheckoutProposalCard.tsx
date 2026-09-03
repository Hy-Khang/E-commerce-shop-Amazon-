import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircle2,
  CreditCard,
  Loader2,
  LogIn,
  MapPin,
  Tag,
  X,
} from 'lucide-react';
import { ROUTES } from '@/common/constants/routes';
import { formatPrice } from '@/common/utils/format.util';
import { useAuthStore } from '@/features/auth';
import { useAddresses } from '@/features/user-profile';
import { useCheckout, usePreviewCheckout } from '@/features/order';
import { useCreatePayment } from '@/features/payment';
import type { PaymentMethod } from '@/features/order';
import { useAiChatStore } from '../stores/ai-chat.store';
import type { AiCheckoutProposal, AiOrderPlaced } from '../types/ai-chat.types';

interface Props {
  proposal: AiCheckoutProposal;
  onNavigate?: () => void;
  /** When provided, the parent swaps this card for an "order placed" card on a
   *  successful confirm (so it persists). Absent → inline success fallback. */
  onPlaced?: (data: AiOrderPlaced) => void;
}

const PAYMENT_OPTIONS: { value: PaymentMethod; label: string }[] = [
  { value: 'cod', label: 'COD (on delivery)' },
  { value: 'vnpay', label: 'VNPay' },
  { value: 'momo', label: 'MoMo' },
];

/**
 * Mini-checkout confirmation card. The agent only *proposes* — this card shows
 * the advisory totals and lets the customer pick address + payment, then calls
 * the real `POST /orders` (money moves only on the explicit Confirm click).
 */
export function AiCheckoutProposalCard({ proposal, onNavigate, onPlaced }: Props) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const openLoginPrompt = useAiChatStore((s) => s.openLoginPrompt);
  const { data: addresses, isLoading } = useAddresses();
  const checkout = useCheckout();
  const createPayment = useCreatePayment();

  const [addressId, setAddressId] = useState<number | null>(null);
  const [method, setMethod] = useState<PaymentMethod>('cod');
  const [placedGroupId, setPlacedGroupId] = useState<string | null>(null);

  // Inline voucher editing: start from what the agent proposed; applying/removing
  // a code re-runs the advisory preview so the totals stay exact (same endpoint
  // the real checkout page uses). Coins are kept as the agent proposed them.
  const [codes, setCodes] = useState<string[]>(proposal.coupon_codes);
  const [couponInput, setCouponInput] = useState('');
  const [dirty, setDirty] = useState(false);
  const coins = proposal.coins_to_redeem;

  const previewQuery = usePreviewCheckout(codes, 'ai-checkout', coins, dirty);
  // While dirty: use the fresh preview; on a bad code the query errors and we
  // fall back to the last-known (proposal) totals + disable Confirm.
  const preview = (dirty ? previewQuery.data : undefined) ?? proposal.preview;
  const previewError = dirty && previewQuery.isError;
  const previewLoading = dirty && previewQuery.isFetching;
  const busy = checkout.isPending || createPayment.isPending;

  const applyCode = () => {
    const code = couponInput.trim().toUpperCase();
    setCouponInput('');
    if (!code || codes.includes(code)) return;
    setCodes([...codes, code]);
    setDirty(true);
  };

  const removeCode = (code: string) => {
    setCodes(codes.filter((c) => c !== code));
    setDirty(true);
  };

  // Preselect the default address (or the first) once addresses load.
  const selectedAddressId =
    addressId ?? addresses?.find((a) => a.is_default)?.id ?? addresses?.[0]?.id ?? null;

  if (!isAuthenticated) {
    return (
      <ProposalShell>
        <p className="text-xs text-text-secondary">You need to sign in to place an order.</p>
        <button
          type="button"
          onClick={openLoginPrompt}
          className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-brand-hover"
        >
          <LogIn className="h-3.5 w-3.5" /> Sign in to order
        </button>
      </ProposalShell>
    );
  }

  if (placedGroupId) {
    return (
      <ProposalShell>
        <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
          <CheckCircle2 className="h-4 w-4" />
          Order placed successfully!
        </div>
        <p className="mt-1 text-xs text-text-secondary">
          Order code: <span className="font-mono">{placedGroupId.slice(0, 8)}</span>
        </p>
        <Link
          to={ROUTES.ORDERS}
          onClick={onNavigate}
          className="mt-2 block rounded-lg border border-border-brand px-3 py-1.5 text-center text-xs font-semibold text-text-brand transition-colors hover:bg-brand-light"
        >
          View my orders
        </Link>
      </ProposalShell>
    );
  }

  const hasAddress = !!selectedAddressId;

  const handleConfirm = async () => {
    if (!selectedAddressId) return;
    try {
      const res = await checkout.mutateAsync({
        payment_method: method,
        address_id: selectedAddressId,
        ...(codes.length && { coupon_codes: codes }),
        ...(coins > 0 && { coins_to_redeem: coins }),
      });
      // Swap the proposal for a persisted "order placed" card (or fall back to
      // an inline success state when rendered standalone / without a parent).
      const placed: AiOrderPlaced = {
        order_group_id: res.order_group_id,
        payment_method: method,
      };
      const markPlaced = () => {
        if (onPlaced) onPlaced(placed);
        else setPlacedGroupId(res.order_group_id);
      };

      if (method === 'cod') {
        markPlaced();
        return;
      }
      // Online payment → create the gateway transaction first (card still
      // mounted), then mark placed and redirect (the page unloads immediately).
      const pay = await createPayment.mutateAsync({ order_group_id: res.order_group_id });
      markPlaced();
      window.location.href = pay.payment_url;
    } catch {
      // useCheckout / useCreatePayment already surface an error toast.
    }
  };

  return (
    <ProposalShell>
      <div className="flex items-center gap-1.5 text-xs font-semibold text-text-primary">
        <CreditCard className="h-4 w-4 text-text-brand" />
        Confirm order
      </div>

      {/* Totals */}
      <dl className="mt-2 space-y-1 text-xs">
        <Row label="Subtotal" value={formatPrice(preview.subtotal)} />
        {preview.discount_total > 0 && (
          <Row label="Discount" value={`-${formatPrice(preview.discount_total)}`} accent />
        )}
        {preview.coin_discount > 0 && (
          <Row label="Coins" value={`-${formatPrice(preview.coin_discount)}`} accent />
        )}
        <Row label="Shipping" value={formatPrice(preview.shipping_total)} />
        <div className="flex items-center justify-between border-t border-border-default pt-1.5">
          <dt className="font-semibold text-text-primary">Total</dt>
          <dd className="text-sm font-bold text-text-price">
            {formatPrice(preview.grand_total)}
          </dd>
        </div>
      </dl>

      {/* Voucher — apply/remove re-previews the totals above */}
      <div className="mt-3">
        <p className="mb-1 flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-text-muted">
          <Tag className="h-3 w-3" /> Voucher
        </p>
        {codes.length > 0 && (
          <div className="mb-1.5 flex flex-wrap gap-1.5">
            {codes.map((c) => (
              <span
                key={c}
                className="inline-flex items-center gap-1 rounded-full border border-border-brand bg-brand-light px-2 py-0.5 text-[11px] font-medium text-text-brand"
              >
                {c}
                <button
                  type="button"
                  onClick={() => removeCode(c)}
                  aria-label={`Remove ${c}`}
                  className="text-text-brand/70 hover:text-text-brand"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}
        <div className="flex gap-1.5">
          <input
            value={couponInput}
            onChange={(e) => setCouponInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                applyCode();
              }
            }}
            placeholder="Enter coupon code"
            className="min-w-0 flex-1 rounded-lg border border-border-default bg-white px-2 py-1.5 text-xs text-text-primary uppercase placeholder:normal-case placeholder:text-text-muted focus:border-border-brand focus:outline-none"
          />
          <button
            type="button"
            onClick={applyCode}
            disabled={!couponInput.trim() || previewLoading}
            className="rounded-lg border border-border-brand px-2.5 py-1 text-xs font-semibold text-text-brand transition-colors hover:bg-brand-light disabled:opacity-50 disabled:pointer-events-none"
          >
            Apply
          </button>
        </div>
        {previewLoading && (
          <p className="mt-1 text-[11px] text-text-muted">Updating total…</p>
        )}
        {previewError && (
          <p className="mt-1 text-[11px] text-rose-600">
            Couldn&apos;t apply a code — it may be expired or not eligible for this
            cart. Remove it to continue.
          </p>
        )}
      </div>

      {/* Address */}
      <div className="mt-3">
        <p className="mb-1 flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-text-muted">
          <MapPin className="h-3 w-3" /> Shipping address
        </p>
        {isLoading ? (
          <p className="text-xs text-text-muted">Loading addresses…</p>
        ) : !hasAddress ? (
          <Link
            to={ROUTES.ADDRESSES}
            onClick={onNavigate}
            className="block rounded-lg border border-dashed border-border-strong px-3 py-2 text-center text-xs font-medium text-text-brand hover:bg-brand-light"
          >
            + Add a shipping address
          </Link>
        ) : (
          <select
            value={selectedAddressId ?? ''}
            onChange={(e) => setAddressId(Number(e.target.value))}
            className="w-full rounded-lg border border-border-default bg-white px-2 py-1.5 text-xs text-text-primary focus:border-border-brand focus:outline-none"
          >
            {addresses!.map((a) => (
              <option key={a.id} value={a.id}>
                {a.full_name} — {a.address_line}, {a.city}
                {a.is_default ? ' (default)' : ''}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Payment method */}
      <div className="mt-3">
        <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-text-muted">
          Payment method
        </p>
        <div className="flex flex-wrap gap-1.5">
          {PAYMENT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setMethod(opt.value)}
              className={`rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors ${
                method === opt.value
                  ? 'border-border-brand bg-brand-light text-text-brand'
                  : 'border-border-default text-text-secondary hover:border-border-strong'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={handleConfirm}
        disabled={!hasAddress || busy || previewError || previewLoading}
        className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg bg-brand px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-brand-hover disabled:opacity-50 disabled:pointer-events-none"
      >
        {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
        {method === 'cod' ? 'Confirm order' : 'Place order & pay'}
      </button>
    </ProposalShell>
  );
}

function ProposalShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-2 rounded-xl border border-border-brand/40 bg-surface p-3">
      {children}
    </div>
  );
}

function Row({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-text-secondary">{label}</dt>
      <dd className={accent ? 'text-text-price' : 'text-text-primary'}>{value}</dd>
    </div>
  );
}
