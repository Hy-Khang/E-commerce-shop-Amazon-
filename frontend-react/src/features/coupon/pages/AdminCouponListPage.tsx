import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Pencil, Power, Plus, Search, Tag, Lock, LockOpen, Receipt } from 'lucide-react';
import { usePagination } from '@/common/hooks/usePagination';
import { formatPrice, formatDate } from '@/common/utils/format.util';
import { AdminDataTable, type Column } from '@/common/components/data/AdminDataTable';
import { AdminSortSelect, type SortOption } from '@/common/components/data/AdminSortSelect';
import { AdminSelect } from '@/common/components/data/AdminSelect';
import { Button } from '@/common/components/ui/Button';
import { ConfirmModal } from '@/common/components/ui/ConfirmModal';
import { useAdminCoupons } from '../hooks/useAdminCoupons';
import { useAdminCoupon } from '../hooks/useAdminCoupon';
import { useCreateCoupon } from '../hooks/useCreateCoupon';
import { useUpdateCoupon } from '../hooks/useUpdateCoupon';
import { useDeactivateCoupon } from '../hooks/useDeactivateCoupon';
import { useUnlockCoupon } from '../hooks/useUnlockCoupon';
import { CouponFormModal } from '../components/CouponFormModal';
import { AdminCouponUsagesDrawer } from '../components/AdminCouponUsagesDrawer';
import type {
  CouponListParams,
  CouponScope,
  DiscountType,
  Coupon,
  CreateCouponFormData,
} from '../types/coupon.types';

const SCOPE_LABELS: Record<CouponScope, string> = {
  all: 'All',
  categories: 'Categories',
  products: 'Products',
};

const COUPON_SORT_OPTIONS: SortOption[] = [
  { label: 'Newest', sort: 'created_at', order: 'desc' },
  { label: 'Expiring soon', sort: 'expires_at', order: 'asc' },
  { label: 'Code A→Z', sort: 'code', order: 'asc' },
  { label: 'Most used', sort: 'current_uses', order: 'desc' },
];

function DiscountDisplay({ type, value }: { type: DiscountType; value: number }) {
  return type === 'percentage'
    ? <span>{value}%</span>
    : <span>{formatPrice(value)}</span>;
}

export default function AdminCouponListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { params, setPage } = usePagination({ limit: 20, sort: 'created_at', order: 'desc' });

  const filters: CouponListParams = {
    ...params,
    search: searchParams.get('search') || undefined,
    scope: (searchParams.get('scope') as CouponScope) || undefined,
    owner: (searchParams.get('owner') as 'platform' | 'shop') || undefined,
    is_active: searchParams.get('is_active') !== null ? searchParams.get('is_active') === 'true' : undefined,
  };

  const { data, isLoading } = useAdminCoupons(filters);
  const deactivate = useDeactivateCoupon();
  const unlock = useUnlockCoupon();
  const [deactivateTarget, setDeactivateTarget] = useState<number | null>(null);

  const [showCreate, setShowCreate] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [usagesTarget, setUsagesTarget] = useState<Coupon | null>(null);

  const createCoupon = useCreateCoupon();
  const updateCoupon = useUpdateCoupon(editId ?? 0);
  const { data: editDetail, isLoading: editLoading } = useAdminCoupon(editId ?? 0);

  function handleCreate(data: CreateCouponFormData) {
    createCoupon.mutate(
      {
        ...data,
        description: data.description || undefined,
        category_ids: data.scope === 'categories' ? data.category_ids : undefined,
        product_ids: data.scope === 'products' ? data.product_ids : undefined,
        min_order_amount: data.min_order_amount ?? undefined,
        max_discount_amount: data.max_discount_amount ?? undefined,
        max_uses: data.max_uses ?? undefined,
      },
      { onSuccess: () => setShowCreate(false) },
    );
  }

  function handleUpdate(data: CreateCouponFormData) {
    if (editId === null) return;
    // `code` is immutable on update — drop it from the payload.
    const { code: _code, ...rest } = data;
    void _code;
    updateCoupon.mutate(
      {
        ...rest,
        description: rest.description || undefined,
        category_ids: rest.scope === 'categories' ? rest.category_ids : undefined,
        product_ids: rest.scope === 'products' ? rest.product_ids : undefined,
        min_order_amount: rest.min_order_amount ?? undefined,
        max_discount_amount: rest.max_discount_amount ?? undefined,
        max_uses: rest.max_uses ?? undefined,
      },
      { onSuccess: () => setEditId(null) },
    );
  }

  function handleSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const search = formData.get('search') as string;
    setSearchParams((prev) => {
      if (search) prev.set('search', search);
      else prev.delete('search');
      prev.set('page', '1');
      return prev;
    });
  }

  function confirmDeactivate() {
    if (deactivateTarget !== null) {
      deactivate.mutate(deactivateTarget);
      setDeactivateTarget(null);
    }
  }

  const columns: Column<Coupon>[] = [
    {
      key: 'code',
      header: 'Code',
      render: (coupon) => (
        <div>
          <span className="font-mono text-sm font-medium text-slate-900 dark:text-slate-100">{coupon.code}</span>
          {coupon.description && (
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{coupon.description}</p>
          )}
        </div>
      ),
    },
    {
      key: 'owner',
      header: 'Owner',
      render: (coupon) =>
        coupon.shop ? (
          <span className="inline-flex rounded-md bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
            {coupon.shop.name}
          </span>
        ) : (
          <span className="inline-flex rounded-md bg-sky-50 px-2 py-0.5 text-xs font-medium text-sky-700 dark:bg-sky-500/15 dark:text-sky-300">
            Platform
          </span>
        ),
    },
    {
      key: 'discount',
      header: 'Discount',
      render: (coupon) => (
        <span className="text-slate-700 dark:text-slate-300">
          <DiscountDisplay type={coupon.discount_type} value={coupon.discount_value} />
        </span>
      ),
    },
    {
      key: 'scope',
      header: 'Scope',
      render: (coupon) => (
        <span className="inline-flex rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-700 dark:text-slate-300">
          {SCOPE_LABELS[coupon.scope]}
        </span>
      ),
    },
    {
      key: 'usage',
      header: 'Usage',
      render: (coupon) => (
        <span className="text-slate-600 dark:text-slate-300">
          {coupon.current_uses}{coupon.max_uses ? ` / ${coupon.max_uses}` : ' / ∞'}
        </span>
      ),
    },
    {
      key: 'period',
      header: 'Period',
      render: (coupon) => (
        <div className="text-xs text-slate-500 dark:text-slate-400">
          <div>{formatDate(coupon.starts_at)}</div>
          <div>{formatDate(coupon.expires_at)}</div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (coupon) =>
        coupon.admin_disabled ? (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-rose-700 dark:text-rose-400">
            <Lock className="h-3 w-3" />
            Locked
          </span>
        ) : (
          <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${
            coupon.is_active ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'
          }`}>
            <span className={`h-1.5 w-1.5 rounded-full ${coupon.is_active ? 'bg-emerald-500' : 'bg-rose-500'}`} />
            {coupon.is_active ? 'Active' : 'Inactive'}
          </span>
        ),
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right',
      render: (coupon) => (
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            iconOnly
            icon={Receipt}
            aria-label="View usages"
            onClick={() => setUsagesTarget(coupon)}
            className="hover:!text-teal-600"
          />
          {/* Shop coupons are seller-owned — admins may only deactivate/unlock them. */}
          {coupon.shop_id == null && (
            <Button
              variant="ghost"
              iconOnly
              icon={Pencil}
              aria-label="Edit coupon"
              onClick={() => setEditId(coupon.id)}
            />
          )}
          {coupon.admin_disabled ? (
            <Button
              variant="ghost"
              iconOnly
              icon={LockOpen}
              aria-label="Unlock coupon"
              onClick={() => unlock.mutate(coupon.id)}
              disabled={unlock.isPending}
              className="hover:!text-emerald-600"
            />
          ) : (
            coupon.is_active && (
              <Button
                variant="ghost"
                iconOnly
                icon={Power}
                aria-label="Deactivate coupon"
                onClick={() => setDeactivateTarget(coupon.id)}
                disabled={deactivate.isPending}
                className="hover:!text-rose-600"
              />
            )
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Coupons</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Manage discount codes and promotions</p>
        </div>
        <button
          type="button"
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-teal-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Create Coupon
        </button>
      </div>

      <AdminDataTable
        columns={columns}
        data={data?.data}
        isLoading={isLoading}
        meta={data?.meta}
        onPageChange={setPage}
        emptyIcon={Tag}
        emptyTitle="No coupons found"
        emptyDescription="Create a coupon to start offering discounts."
        toolbar={
          <div className="admin-card p-4">
            <div className="flex flex-wrap gap-3">
              <form onSubmit={handleSearch} className="flex flex-1 gap-2">
                <div className="relative min-w-[200px] flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                  <input
                    name="search"
                    type="text"
                    placeholder="Search by code..."
                    defaultValue={searchParams.get('search') || ''}
                    className="admin-input pl-9"
                  />
                </div>
                <Button type="submit" variant="secondary">Search</Button>
              </form>
              <AdminSelect
                ariaLabel="Filter by owner"
                className="w-40"
                value={searchParams.get('owner') || ''}
                onChange={(v) => setSearchParams((prev) => {
                  if (v) prev.set('owner', v);
                  else prev.delete('owner');
                  prev.set('page', '1');
                  return prev;
                })}
                options={[
                  { value: '', label: 'All owners' },
                  { value: 'platform', label: 'Platform' },
                  { value: 'shop', label: 'Shop' },
                ]}
              />
              <AdminSelect
                ariaLabel="Filter by scope"
                className="w-44"
                value={searchParams.get('scope') || ''}
                onChange={(v) => setSearchParams((prev) => {
                  if (v) prev.set('scope', v);
                  else prev.delete('scope');
                  prev.set('page', '1');
                  return prev;
                })}
                options={[
                  { value: '', label: 'All scopes' },
                  { value: 'all', label: 'All (order-wide)' },
                  { value: 'categories', label: 'Categories' },
                  { value: 'products', label: 'Products' },
                ]}
              />
              <AdminSelect
                ariaLabel="Filter by status"
                className="w-40"
                value={searchParams.get('is_active') ?? ''}
                onChange={(v) => setSearchParams((prev) => {
                  if (v !== '') prev.set('is_active', v);
                  else prev.delete('is_active');
                  prev.set('page', '1');
                  return prev;
                })}
                options={[
                  { value: '', label: 'All status' },
                  { value: 'true', label: 'Active' },
                  { value: 'false', label: 'Inactive' },
                ]}
              />
              <AdminSortSelect options={COUPON_SORT_OPTIONS} bare />
            </div>
          </div>
        }
      />

      <CouponFormModal
        open={showCreate}
        onClose={() => {
          createCoupon.reset();
          setShowCreate(false);
        }}
        title="Create Coupon"
        onSubmit={handleCreate}
        isPending={createCoupon.isPending}
        error={createCoupon.error}
      />

      <CouponFormModal
        open={editId !== null}
        onClose={() => {
          updateCoupon.reset();
          setEditId(null);
        }}
        title={editDetail ? `Edit: ${editDetail.code}` : 'Edit Coupon'}
        onSubmit={handleUpdate}
        isPending={updateCoupon.isPending}
        error={updateCoupon.error}
        detail={editDetail}
        isLoadingDetail={editLoading}
        isEdit
      />

      <AdminCouponUsagesDrawer
        couponId={usagesTarget?.id ?? null}
        couponCode={usagesTarget?.code}
        onClose={() => setUsagesTarget(null)}
      />

      <ConfirmModal
        open={deactivateTarget !== null}
        title="Deactivate Coupon"
        message="Are you sure you want to deactivate this coupon? Customers will no longer be able to use it."
        variant="warning"
        confirmLabel="Deactivate"
        loading={deactivate.isPending}
        onConfirm={confirmDeactivate}
        onCancel={() => setDeactivateTarget(null)}
      />
    </div>
  );
}
