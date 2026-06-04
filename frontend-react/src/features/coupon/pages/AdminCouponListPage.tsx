import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { usePagination } from '@/common/hooks/usePagination';
import { formatPrice, formatDate } from '@/common/utils/format.util';
import { ROUTES } from '@/common/constants/routes';
import { ConfirmModal } from '@/common/components/ui/ConfirmModal';
import { useAdminCoupons } from '../hooks/useAdminCoupons';
import { useDeactivateCoupon } from '../hooks/useDeactivateCoupon';
import type { CouponListParams, CouponScope, DiscountType } from '../types/coupon.types';

const SCOPE_LABELS: Record<CouponScope, string> = {
  all: 'All',
  categories: 'Categories',
  products: 'Products',
};

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
    is_active: searchParams.get('is_active') !== null ? searchParams.get('is_active') === 'true' : undefined,
  };

  const { data, isLoading } = useAdminCoupons(filters);
  const deactivate = useDeactivateCoupon();
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

  function handleDeactivate(id: number) {
    setDeactivateTarget(id);
  }

  function confirmDeactivate() {
    if (deactivateTarget !== null) {
      deactivate.mutate(deactivateTarget);
      setDeactivateTarget(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Coupons</h1>
        <Link
          to={ROUTES.ADMIN_COUPON_CREATE}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Create Coupon
        </Link>
      </div>

      <div className="flex flex-wrap gap-2">
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            name="search"
            type="text"
            placeholder="Search by code..."
            defaultValue={searchParams.get('search') || ''}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="rounded-md bg-gray-100 px-4 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-200"
          >
            Search
          </button>
        </form>
        <select
          value={searchParams.get('scope') || ''}
          onChange={(e) => setSearchParams((prev) => {
            if (e.target.value) prev.set('scope', e.target.value);
            else prev.delete('scope');
            prev.set('page', '1');
            return prev;
          })}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
        >
          <option value="">All scopes</option>
          <option value="all">All (order-wide)</option>
          <option value="categories">Categories</option>
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
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
        >
          <option value="">All status</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Code</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Discount</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Scope</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Usage</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Period</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Status</th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 7 }).map((__, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-4 animate-pulse rounded bg-gray-200" />
                    </td>
                  ))}
                </tr>
              ))
            ) : data && data.data.length > 0 ? (
              data.data.map((coupon) => (
                <tr key={coupon.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <span className="font-mono text-sm font-medium text-gray-900">{coupon.code}</span>
                    {coupon.description && (
                      <p className="mt-0.5 text-xs text-gray-500">{coupon.description}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    <DiscountDisplay type={coupon.discount_type} value={coupon.discount_value} />
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
                      {SCOPE_LABELS[coupon.scope]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {coupon.current_uses}{coupon.max_uses ? ` / ${coupon.max_uses}` : ' / -'}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    <div>{formatDate(coupon.starts_at)}</div>
                    <div>{formatDate(coupon.expires_at)}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                      coupon.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {coupon.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        to={ROUTES.ADMIN_COUPON_EDIT(coupon.id)}
                        className="text-sm font-medium text-blue-600 hover:text-blue-800"
                      >
                        Edit
                      </Link>
                      {coupon.is_active && (
                        <button
                          onClick={() => handleDeactivate(coupon.id)}
                          disabled={deactivate.isPending}
                          className="text-sm font-medium text-red-600 hover:text-red-800"
                        >
                          Deactivate
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-sm text-gray-500">
                  No coupons found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {data && data.meta.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage(data.meta.page - 1)}
            disabled={data.meta.page <= 1}
            className="rounded-md border px-3 py-1.5 text-sm disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm text-gray-600">
            Page {data.meta.page} of {data.meta.totalPages}
          </span>
          <button
            onClick={() => setPage(data.meta.page + 1)}
            disabled={data.meta.page >= data.meta.totalPages}
            className="rounded-md border px-3 py-1.5 text-sm disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}

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
