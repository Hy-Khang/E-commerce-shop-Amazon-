import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Pencil, Plus, Search, Trash2, Zap, ListPlus } from 'lucide-react';
import { usePagination } from '@/common/hooks/usePagination';
import { formatDate } from '@/common/utils/format.util';
import { AdminDataTable, type Column } from '@/common/components/data/AdminDataTable';
import { AdminSortSelect, type SortOption } from '@/common/components/data/AdminSortSelect';
import { AdminSelect } from '@/common/components/data/AdminSelect';
import { Button } from '@/common/components/ui/Button';
import { ConfirmModal } from '@/common/components/ui/ConfirmModal';
import { useAdminFlashSales, useAdminFlashSale } from '../hooks/useAdminFlashSales';
import {
  useCreateFlashSale,
  useUpdateFlashSale,
  useDeleteFlashSale,
} from '../hooks/useFlashSaleMutations';
import { FlashSaleFormModal } from '../components/FlashSaleFormModal';
import { FlashSaleItemsDrawer } from '../components/FlashSaleItemsDrawer';
import type {
  FlashSale,
  FlashSaleListParams,
  FlashSaleStatus,
  FlashSaleFormData,
} from '../types/flash-sale.types';

const STATUS_STYLES: Record<FlashSaleStatus, string> = {
  scheduled: 'bg-sky-50 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300',
  active: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  ended: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
};

const SORT_OPTIONS: SortOption[] = [
  { label: 'Newest', sort: 'created_at', order: 'desc' },
  { label: 'Starting soon', sort: 'starts_at', order: 'asc' },
  { label: 'Ending soon', sort: 'ends_at', order: 'asc' },
  { label: 'Name A→Z', sort: 'name', order: 'asc' },
];

export default function AdminFlashSaleListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { params, setPage } = usePagination({ limit: 20, sort: 'created_at', order: 'desc' });

  const filters: FlashSaleListParams = {
    ...params,
    search: searchParams.get('search') || undefined,
    status: (searchParams.get('status') as FlashSaleStatus) || undefined,
    is_active:
      searchParams.get('is_active') !== null
        ? searchParams.get('is_active') === 'true'
        : undefined,
  };

  const { data, isLoading } = useAdminFlashSales(filters);
  const remove = useDeleteFlashSale();

  const [showCreate, setShowCreate] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [itemsTarget, setItemsTarget] = useState<FlashSale | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);

  const createSale = useCreateFlashSale();
  const updateSale = useUpdateFlashSale(editId ?? 0);
  const { data: editDetail, isLoading: editLoading } = useAdminFlashSale(editId ?? 0);

  function handleCreate(form: FlashSaleFormData) {
    createSale.mutate(
      {
        name: form.name,
        registration_starts_at: new Date(form.registration_starts_at).toISOString(),
        registration_ends_at: new Date(form.registration_ends_at).toISOString(),
        starts_at: new Date(form.starts_at).toISOString(),
        ends_at: new Date(form.ends_at).toISOString(),
        min_discount_percent: form.min_discount_percent,
      },
      { onSuccess: () => setShowCreate(false) },
    );
  }

  function handleUpdate(form: FlashSaleFormData) {
    if (editId === null) return;
    updateSale.mutate(
      {
        name: form.name,
        registration_starts_at: new Date(form.registration_starts_at).toISOString(),
        registration_ends_at: new Date(form.registration_ends_at).toISOString(),
        starts_at: new Date(form.starts_at).toISOString(),
        ends_at: new Date(form.ends_at).toISOString(),
        min_discount_percent: form.min_discount_percent,
        is_active: form.is_active,
      },
      { onSuccess: () => setEditId(null) },
    );
  }

  function handleSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const search = new FormData(e.currentTarget).get('search') as string;
    setSearchParams((prev) => {
      if (search) prev.set('search', search);
      else prev.delete('search');
      prev.set('page', '1');
      return prev;
    });
  }

  function confirmDelete() {
    if (deleteTarget !== null) {
      remove.mutate(deleteTarget);
      setDeleteTarget(null);
    }
  }

  const columns: Column<FlashSale>[] = [
    {
      key: 'name',
      header: 'Campaign',
      render: (sale) => (
        <span className="text-sm font-medium text-slate-900 dark:text-slate-100">{sale.name}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (sale) => (
        <span className={`inline-flex rounded-md px-2 py-0.5 text-xs font-medium capitalize ${STATUS_STYLES[sale.status]}`}>
          {sale.status}
        </span>
      ),
    },
    {
      key: 'items',
      header: 'Registrations',
      render: (sale) => (
        <div className="flex items-center gap-2">
          <span className="text-slate-600 dark:text-slate-300">{sale.item_count}</span>
          {sale.pending_count > 0 && (
            <span className="inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
              {sale.pending_count} pending
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'period',
      header: 'Period',
      render: (sale) => (
        <div className="text-xs text-slate-500 dark:text-slate-400">
          <div>{formatDate(sale.starts_at)}</div>
          <div>{formatDate(sale.ends_at)}</div>
        </div>
      ),
    },
    {
      key: 'active',
      header: 'Enabled',
      render: (sale) => (
        <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${
          sale.is_active ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'
        }`}>
          <span className={`h-1.5 w-1.5 rounded-full ${sale.is_active ? 'bg-emerald-500' : 'bg-rose-500'}`} />
          {sale.is_active ? 'Yes' : 'No'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right',
      render: (sale) => (
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            iconOnly
            icon={ListPlus}
            aria-label="Moderate registrations"
            onClick={() => setItemsTarget(sale)}
            className="hover:!text-teal-600"
          />
          <Button
            variant="ghost"
            iconOnly
            icon={Pencil}
            aria-label="Edit flash sale"
            onClick={() => setEditId(sale.id)}
          />
          <Button
            variant="ghost"
            iconOnly
            icon={Trash2}
            aria-label="Delete flash sale"
            onClick={() => setDeleteTarget(sale.id)}
            disabled={remove.isPending}
            className="hover:!text-rose-600"
          />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Flash Sales</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Time-limited discount campaigns
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-teal-700"
        >
          <Plus className="h-4 w-4" />
          Create Flash Sale
        </button>
      </div>

      <AdminDataTable
        columns={columns}
        data={data?.data}
        isLoading={isLoading}
        meta={data?.meta}
        onPageChange={setPage}
        emptyIcon={Zap}
        emptyTitle="No flash sales found"
        emptyDescription="Create a campaign to start offering time-limited deals."
        toolbar={
          <div className="admin-card p-4">
            <div className="flex flex-wrap gap-3">
              <form onSubmit={handleSearch} className="flex flex-1 gap-2">
                <div className="relative min-w-[200px] flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                  <input
                    name="search"
                    type="text"
                    placeholder="Search by name..."
                    defaultValue={searchParams.get('search') || ''}
                    className="admin-input pl-9"
                  />
                </div>
                <Button type="submit" variant="secondary">Search</Button>
              </form>
              <AdminSelect
                ariaLabel="Filter by status"
                className="w-44"
                value={searchParams.get('status') || ''}
                onChange={(v) => setSearchParams((prev) => {
                  if (v) prev.set('status', v);
                  else prev.delete('status');
                  prev.set('page', '1');
                  return prev;
                })}
                options={[
                  { value: '', label: 'All statuses' },
                  { value: 'scheduled', label: 'Scheduled' },
                  { value: 'active', label: 'Active' },
                  { value: 'ended', label: 'Ended' },
                ]}
              />
              <AdminSelect
                ariaLabel="Filter by enabled"
                className="w-40"
                value={searchParams.get('is_active') ?? ''}
                onChange={(v) => setSearchParams((prev) => {
                  if (v !== '') prev.set('is_active', v);
                  else prev.delete('is_active');
                  prev.set('page', '1');
                  return prev;
                })}
                options={[
                  { value: '', label: 'All' },
                  { value: 'true', label: 'Enabled' },
                  { value: 'false', label: 'Disabled' },
                ]}
              />
              <AdminSortSelect options={SORT_OPTIONS} bare />
            </div>
          </div>
        }
      />

      <FlashSaleFormModal
        open={showCreate}
        onClose={() => {
          createSale.reset();
          setShowCreate(false);
        }}
        title="Create Flash Sale"
        onSubmit={handleCreate}
        isPending={createSale.isPending}
        error={createSale.error}
      />

      <FlashSaleFormModal
        open={editId !== null}
        onClose={() => {
          updateSale.reset();
          setEditId(null);
        }}
        title={editDetail ? `Edit: ${editDetail.name}` : 'Edit Flash Sale'}
        onSubmit={handleUpdate}
        isPending={updateSale.isPending}
        error={updateSale.error}
        detail={editDetail}
        isLoadingDetail={editLoading}
        isEdit
      />

      <FlashSaleItemsDrawer
        campaignId={itemsTarget?.id ?? null}
        campaignName={itemsTarget?.name}
        onClose={() => setItemsTarget(null)}
      />

      <ConfirmModal
        open={deleteTarget !== null}
        title="Delete Flash Sale"
        message="Are you sure? This removes the campaign and all its items."
        variant="danger"
        confirmLabel="Delete"
        loading={remove.isPending}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
