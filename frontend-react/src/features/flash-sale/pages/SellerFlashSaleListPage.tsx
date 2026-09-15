import { useState } from 'react';
import { Loader2, Zap, Pencil, Trash2 } from 'lucide-react';
import { formatPrice, formatDate } from '@/common/utils/format.util';
import { AdminSelect } from '@/common/components/data/AdminSelect';
import { ConfirmModal } from '@/common/components/ui/ConfirmModal';
import { Drawer } from '@/common/components/ui/Drawer';
import { CountdownTimer } from '../components/CountdownTimer';
import { FlashSaleRegisterModal } from '../components/FlashSaleRegisterModal';
import {
  useOpenFlashCampaigns,
  useMyFlashRegistrations,
} from '../hooks/useSellerFlashSales';
import {
  useUpdateFlashRegistration,
  useWithdrawFlashRegistration,
} from '../hooks/useSellerFlashSaleMutations';
import type {
  FlashSale,
  FlashSaleItem,
  FlashSaleRegistrationStatus,
} from '../types/flash-sale.types';

const STATUS_STYLES: Record<FlashSaleRegistrationStatus, string> = {
  pending: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
  approved: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  rejected: 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300',
};
const STATUS_LABELS: Record<FlashSaleRegistrationStatus, string> = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
};

export default function SellerFlashSaleListPage() {
  const { data: campaigns, isLoading: loadingOpen } = useOpenFlashCampaigns();
  const [statusFilter, setStatusFilter] = useState<string>('');
  const { data: regs, isLoading: loadingRegs } = useMyFlashRegistrations({
    page: 1,
    limit: 50,
    status: (statusFilter as FlashSaleRegistrationStatus) || undefined,
  });

  const [registerTarget, setRegisterTarget] = useState<FlashSale | null>(null);
  const [withdrawId, setWithdrawId] = useState<number | null>(null);
  const [editing, setEditing] = useState<FlashSaleItem | null>(null);

  const withdraw = useWithdrawFlashRegistration();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Flash Sale
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Register your shop's products for Flash Sale campaigns
        </p>
      </div>

      {/* Open campaigns */}
      <section>
        <h2 className="mb-3 text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Open for registration
        </h2>
        {loadingOpen ? (
          <div className="flex h-24 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
          </div>
        ) : !campaigns || campaigns.length === 0 ? (
          <p className="admin-card p-6 text-center text-sm text-slate-500 dark:text-slate-400">
            No campaigns are open for registration right now.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {campaigns.map((c) => (
              <div key={c.id} className="admin-card flex flex-col p-4">
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{c.name}</p>
                <div className="mt-2 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <span>Registration ends:</span>
                  <CountdownTimer endsAt={c.registration_ends_at} />
                </div>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Runs: {formatDate(c.starts_at)} → {formatDate(c.ends_at)}
                </p>
                <p className="mt-1 text-xs font-medium text-amber-700 dark:text-amber-300">
                  Min discount {c.min_discount_percent}%
                </p>
                <button
                  type="button"
                  onClick={() => setRegisterTarget(c)}
                  className="mt-3 inline-flex items-center justify-center gap-1.5 rounded-lg bg-amber-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-amber-700"
                >
                  <Zap className="h-4 w-4" />
                  Register
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* My registrations */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100">
            My registrations
          </h2>
          <AdminSelect
            ariaLabel="Filter by status"
            className="w-44"
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { value: '', label: 'All statuses' },
              { value: 'pending', label: 'Pending' },
              { value: 'approved', label: 'Approved' },
              { value: 'rejected', label: 'Rejected' },
            ]}
          />
        </div>

        {loadingRegs ? (
          <div className="flex h-24 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
          </div>
        ) : !regs || regs.data.length === 0 ? (
          <p className="admin-card p-6 text-center text-sm text-slate-500 dark:text-slate-400">
            No registrations yet.
          </p>
        ) : (
          <div className="admin-card divide-y divide-slate-100 dark:divide-slate-800">
            {regs.data.map((item) => (
              <div key={item.id} className="flex items-center gap-3 p-4">
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
                    {formatPrice(item.flash_price)} · Qty {item.flash_quantity}
                    {item.status === 'approved' && ` · sold ${item.sold_quantity}`}
                  </p>
                  {item.status === 'rejected' && item.reject_reason && (
                    <p className="mt-0.5 text-xs text-rose-600 dark:text-rose-400">
                      Reason: {item.reject_reason}
                    </p>
                  )}
                </div>
                <span className={`inline-flex shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_STYLES[item.status]}`}>
                  {STATUS_LABELS[item.status]}
                </span>
                {item.status === 'pending' && (
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setEditing(item)}
                      className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800"
                      aria-label="Edit registration"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setWithdrawId(item.id)}
                      className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10"
                      aria-label="Withdraw registration"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      <FlashSaleRegisterModal
        campaign={registerTarget}
        onClose={() => setRegisterTarget(null)}
      />

      {editing && <EditRegistrationRow item={editing} onClose={() => setEditing(null)} />}

      <ConfirmModal
        open={withdrawId !== null}
        title="Withdraw registration"
        message="Are you sure you want to withdraw this registration from the campaign?"
        variant="danger"
        confirmLabel="Withdraw"
        loading={withdraw.isPending}
        onConfirm={() => {
          if (withdrawId !== null) withdraw.mutate(withdrawId, { onSuccess: () => setWithdrawId(null) });
        }}
        onCancel={() => setWithdrawId(null)}
      />
    </div>
  );
}

/** Small edit dialog for a pending registration's price & quantity. */
function EditRegistrationRow({ item, onClose }: { item: FlashSaleItem; onClose: () => void }) {
  const [price, setPrice] = useState(String(item.flash_price));
  const [qty, setQty] = useState(String(item.flash_quantity));
  const update = useUpdateFlashRegistration();

  function save() {
    update.mutate(
      { itemId: item.id, data: { flash_price: Number(price), flash_quantity: Number(qty) } },
      { onSuccess: onClose },
    );
  }

  return (
    <Drawer open onClose={onClose} title="Edit registration" variant="modal" size="md">
      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Flash Sale price</label>
          <input type="number" min={1} step="any" className="admin-input" value={price} onChange={(e) => setPrice(e.target.value)} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Quantity</label>
          <input type="number" min={1} className="admin-input" value={qty} onChange={(e) => setQty(e.target.value)} />
        </div>
        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={save}
            disabled={update.isPending}
            className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-amber-700 disabled:opacity-50"
          >
            {update.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Save
          </button>
        </div>
      </div>
    </Drawer>
  );
}
