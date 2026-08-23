import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Pencil, Power, PowerOff, Plus, Search, Tag, Lock, Receipt } from 'lucide-react';
import { usePagination } from '@/common/hooks/usePagination';
import { formatPrice, formatDate } from '@/common/utils/format.util';
import { AdminDataTable, type Column } from '@/common/components/data/AdminDataTable';
import { AdminSortSelect, type SortOption } from '@/common/components/data/AdminSortSelect';
import { Button } from '@/common/components/ui/Button';
import { ConfirmModal } from '@/common/components/ui/ConfirmModal';
import { useMyShop } from '@/features/shop';
import { useSellerCoupons, useSellerCoupon } from '../hooks/useSellerCoupons';
import {
  useCreateSellerCoupon,
  useUpdateSellerCoupon,
  useDeactivateSellerCoupon,
  useReactivateSellerCoupon,
} from '../hooks/useSellerCouponMutations';
import { CouponFormModal } from '../components/CouponFormModal';
import { SellerCouponUsagesDrawer } from '../components/SellerCouponUsagesDrawer';
import type {
  CouponListParams,
  CouponScope,
  DiscountType,
  Coupon,
  CreateCouponFormData,
} from '../types/coupon.types';

const SCOPE_LABELS: Record<CouponScope, string> = {
  all: 'Whole shop',
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
  return type === 'percentage' ? <span>{value}%</span> : <span>{formatPrice(value)}</span>;
}

export default function SellerCouponListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { params, setPage } = usePagination({ limit: 20, sort: 'created_at', order: 'desc' });

  const filters: CouponListParams = {
    ...params,
    search: searchParams.get('search') || undefined,
    scope: (searchParams.get('scope') as CouponScope) || undefined,
    is_active: searchParams.get('is_active') !== null ? searchParams.get('is_active') === 'true' : undefined,
  };

  const { data, isLoading } = useSellerCoupons(filters);
  const { data: shop } = useMyShop();
  const deactivate = useDeactivateSellerCoupon();
  const reactivate = useReactivateSellerCoupon();
  const [deactivateTarget, setDeactivateTarget] = useState<number | null>(null);

  const [showCreate, setShowCreate] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [usagesTarget, setUsagesTarget] = useState<Coupon | null>(null);

  const createCoupon = useCreateSellerCoupon();
  const updateCoupon = useUpdateSellerCoupon(editId ?? 0);
  const { data: editDetail, isLoading: editLoading } = useSellerCoupon(editId ?? 0);

  function handleCreate(data: CreateCouponFormData) {
    createCoupon.mutate(
      {
        code: data.code,
        description: data.description || undefined,
        discount_type: data.discount_type,
        discount_value: data.discount_value,
        scope: data.scope === 'products' ? 'products' : 'all',
        product_ids: data.scope === 'products' ? data.product_ids : undefined,
        min_order_amount: data.min_order_amount ?? undefined,
        max_discount_amount: data.max_discount_amount ?? undefined,
        max_uses: data.max_uses ?? undefined,
        max_uses_per_user: data.max_uses_per_user,
        starts_at: data.starts_at,
        expires_at: data.expires_at,
      },
      { onSuccess: () => setShowCreate(false) },
    );
  }

  function handleUpdate(data: CreateCouponFormData) {
    if (editId === null) return;
    updateCoupon.mutate(
      {
        description: data.description || undefined,
        discount_type: data.discount_type,
        discount_value: data.discount_value,
        scope: data.scope === 'products' ? 'products' : 'all',
        product_ids: data.scope === 'products' ? data.product_ids : undefined,
        min_order_amount: data.min_order_amount ?? undefined,
        max_discount_amount: data.max_discount_amount ?? undefined,
        max_uses: data.max_uses ?? undefined,
        max_uses_per_user: data.max_uses_per_user,
        starts_at: data.starts_at,
        expires_at: data.expires_at,
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
          <span className="font-mono text-sm font-medium text-slate-900">{coupon.code}</span>
          {coupon.description && <p className="mt-0.5 text-xs text-slate-500">{coupon.description}</p>}
        </div>
      ),
    },
    {
      key: 'discount',
      header: 'Discount',
      render: (coupon) => (
        <span className="text-slate-700">
          <DiscountDisplay type={coupon.discount_type} value={coupon.discount_value} />
        </span>
      ),
    },
    {
      key: 'scope',
      header: 'Scope',
      render: (coupon) => (
        <span className="inline-flex rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
          {SCOPE_LABELS[coupon.scope]}
        </span>
      ),
    },
    {
      key: 'usage',
      header: 'Usage',
      render: (coupon) => (
        <span className="text-slate-600">
          {coupon.current_uses}{coupon.max_uses ? ` / ${coupon.max_uses}` : ' / ∞'}
        </span>
      ),
    },
    {
      key: 'period',
      header: 'Period',
      render: (coupon) => (
        <div className="text-xs text-slate-500">
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
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-rose-700">
            <Lock className="h-3 w-3" />
            Locked by admin
          </span>
        ) : (
          <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${
            coupon.is_active ? 'text-emerald-700' : 'text-rose-700'
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
            className="hover:!text-amber-600"
          />
          <Button
            variant="ghost"
            iconOnly
            icon={Pencil}
            aria-label={coupon.admin_disabled ? 'View coupon' : 'Edit coupon'}
            onClick={() => setEditId(coupon.id)}
          />
          {/* A coupon locked by admin cannot be deactivated/reactivated by the seller. */}
          {!coupon.admin_disabled &&
            (coupon.is_active ? (
              <Button
                variant="ghost"
                iconOnly
                icon={Power}
                aria-label="Deactivate coupon"
                onClick={() => setDeactivateTarget(coupon.id)}
                disabled={deactivate.isPending}
                className="hover:!text-rose-600"
              />
            ) : (
              <Button
                variant="ghost"
                iconOnly
                icon={PowerOff}
                aria-label="Reactivate coupon"
                onClick={() => reactivate.mutate(coupon.id)}
                disabled={reactivate.isPending}
                className="hover:!text-emerald-600"
              />
            ))}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Coupons</h1>
          <p className="mt-1 text-sm text-slate-500">Discount codes for your shop's products</p>
        </div>
        <button
          type="button"
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-amber-700 transition-colors"
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
        emptyTitle="No coupons yet"
        emptyDescription="Create a shop coupon to offer discounts on your products."
        toolbar={
          <div className="admin-card p-4">
            <div className="flex flex-wrap gap-3">
              <form onSubmit={handleSearch} className="flex flex-1 gap-2">
                <div className="relative min-w-[200px] flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
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
              <select
                value={searchParams.get('scope') || ''}
                onChange={(e) => setSearchParams((prev) => {
                  if (e.target.value) prev.set('scope', e.target.value);
                  else prev.delete('scope');
                  prev.set('page', '1');
                  return prev;
                })}
                className="admin-input w-auto"
              >
                <option value="">All scopes</option>
                <option value="all">Whole shop</option>
                <option value="products">Products</option>
              </select>
              <select
                value={searchParams.get('is_active') ?? ''}
                onChange={(e) => setSearchParams((prev) => {
                  if (e.target.value !== '') prev.set('is_active', e.target.value);
                  else prev.delete('is_active');
                  prev.set('page', '1');
                  return prev;
                })}
                className="admin-input w-auto"
              >
                <option value="">All status</option>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
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
        hideCategoryScope
        productSource="seller"
        codePrefix={shop?.slug ? shop.slug.toUpperCase() : undefined}
      />

      <CouponFormModal
        open={editId !== null}
        onClose={() => {
          updateCoupon.reset();
          setEditId(null);
        }}
        title={editDetail ? `${editDetail.admin_disabled ? 'View' : 'Edit'}: ${editDetail.code}` : 'Edit Coupon'}
        onSubmit={handleUpdate}
        isPending={updateCoupon.isPending}
        error={updateCoupon.error}
        detail={editDetail}
        isLoadingDetail={editLoading}
        isEdit
        hideCategoryScope
        productSource="seller"
        locked={editDetail?.admin_disabled}
      />

      <SellerCouponUsagesDrawer
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
