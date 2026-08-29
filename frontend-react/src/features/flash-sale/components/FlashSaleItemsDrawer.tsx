import { useState } from 'react';
import { Check, Loader2, X } from 'lucide-react';
import { Drawer } from '@/common/components/ui/Drawer';
import { formatPrice } from '@/common/utils/format.util';
import { useCampaignRegistrations } from '../hooks/useAdminFlashSales';
import {
  useApproveFlashSaleItem,
  useRejectFlashSaleItem,
} from '../hooks/useFlashSaleMutations';
import type {
  FlashSaleItem,
  FlashSaleRegistrationStatus,
} from '../types/flash-sale.types';

interface Props {
  campaignId: number | null;
  campaignName?: string;
  onClose: () => void;
}

const STATUS_STYLES: Record<FlashSaleRegistrationStatus, string> = {
  pending: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
  approved: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  rejected: 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300',
};

function discountPercent(item: FlashSaleItem): number | null {
  if (!item.original_price || item.original_price <= 0) return null;
  return Math.round((1 - item.flash_price / item.original_price) * 100);
}

export function FlashSaleItemsDrawer({ campaignId, campaignName, onClose }: Props) {
  const open = campaignId !== null;
  const { data: items, isLoading } = useCampaignRegistrations(
    campaignId ?? 0,
    open,
  );
  const approve = useApproveFlashSaleItem();
  const reject = useRejectFlashSaleItem();

  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [reason, setReason] = useState('');

  function submitReject(itemId: number) {
    reject.mutate(
      { itemId, data: { reason: reason.trim() || undefined } },
      {
        onSuccess: () => {
          setRejectingId(null);
          setReason('');
        },
      },
    );
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={campaignName ? `Registrations — ${campaignName}` : 'Registrations'}
      variant="modal"
      size="xl"
    >
      {isLoading ? (
        <div className="flex h-32 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
        </div>
      ) : !items || items.length === 0 ? (
        <p className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
          No seller registrations yet.
        </p>
      ) : (
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {items.map((item) => {
            const pct = discountPercent(item);
            return (
              <div key={item.id} className="py-3">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-50 dark:border-slate-700">
                    {item.thumbnail_url && (
                      <img src={item.thumbnail_url} alt="" className="h-full w-full object-cover" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                      {item.product_name ?? item.sku ?? `Variant #${item.product_variant_id}`}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {item.shop_name ?? `Shop #${item.shop_id}`} · {formatPrice(item.flash_price)}
                      {pct != null && <span className="text-emerald-600 dark:text-emerald-400"> · -{pct}%</span>}
                      {' · '}qty {item.flash_quantity}
                    </p>
                  </div>
                  <span className={`inline-flex shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${STATUS_STYLES[item.status]}`}>
                    {item.status}
                  </span>
                  {item.status === 'pending' && rejectingId !== item.id && (
                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        type="button"
                        onClick={() => approve.mutate(item.id)}
                        disabled={approve.isPending}
                        className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-emerald-50 hover:text-emerald-600 disabled:opacity-50 dark:hover:bg-emerald-500/10"
                        aria-label="Approve registration"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setRejectingId(item.id);
                          setReason('');
                        }}
                        className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10"
                        aria-label="Reject registration"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>

                {item.status === 'rejected' && item.reject_reason && (
                  <p className="mt-1 pl-14 text-xs text-rose-600 dark:text-rose-400">
                    Lý do: {item.reject_reason}
                  </p>
                )}

                {rejectingId === item.id && (
                  <div className="mt-2 flex items-center gap-2">
                    <input
                      type="text"
                      autoFocus
                      placeholder="Lý do từ chối (tuỳ chọn)"
                      className="admin-input flex-1"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => submitReject(item.id)}
                      disabled={reject.isPending}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-rose-700 disabled:opacity-50"
                    >
                      {reject.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                      Từ chối
                    </button>
                    <button
                      type="button"
                      onClick={() => setRejectingId(null)}
                      className="rounded-lg px-3 py-2 text-sm text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      Huỷ
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Drawer>
  );
}
