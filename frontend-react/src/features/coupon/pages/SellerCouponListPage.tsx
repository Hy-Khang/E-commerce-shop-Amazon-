import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Pencil, Power, Plus, Search, Tag } from 'lucide-react';
import { usePagination } from '@/common/hooks/usePagination';
import { formatPrice, formatDate } from '@/common/utils/format.util';
import { ROUTES } from '@/common/constants/routes';
import { AdminDataTable, type Column } from '@/common/components/data/AdminDataTable';
import { Button } from '@/common/components/ui/Button';
import { ConfirmModal } from '@/common/components/ui/ConfirmModal';
import { useSellerCoupons } from '../hooks/useSellerCoupons';
import { useDeactivateSellerCoupon } from '../hooks/useSellerCouponMutations';
import type { CouponListParams, CouponScope, DiscountType, Coupon } from '../types/coupon.types';

const SCOPE_LABELS: Record<CouponScope, string> = {
  all: 'Whole shop',
  categories: 'Categories',
  products: 'Products',
};

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
  const deactivate = useDeactivateSellerCoupon();
  const [deactivateTarget, setDeactivateTarget] = useState<number | null>(null);

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
      render: (coupon) => (
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
          <Link
            to={ROUTES.SELLER_COUPON_EDIT(coupon.id)}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
            aria-label="Edit coupon"
          >
            <Pencil className="h-4 w-4" />
          </Link>
          {coupon.is_active && (
            <Button
              variant="ghost"
              iconOnly
              icon={Power}
              aria-label="Deactivate coupon"
              onClick={() => setDeactivateTarget(coupon.id)}
              disabled={deactivate.isPending}
              className="hover:!text-rose-600"
            />
          )}
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
        <Link
          to={ROUTES.SELLER_COUPON_CREATE}
          className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-amber-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Create Coupon
        </Link>
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
            </div>
          </div>
        }
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
