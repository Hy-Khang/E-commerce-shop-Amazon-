import { useParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { formatPrice, formatDate } from '@/common/utils/format.util';
import { ROUTES } from '@/common/constants/routes';
import { ApiError } from '@/core/api/api.types';
import { usePagination } from '@/common/hooks/usePagination';
import { useAdminCoupon } from '../hooks/useAdminCoupon';
import { useUpdateCoupon } from '../hooks/useUpdateCoupon';
import { useAdminCouponUsages } from '../hooks/useAdminCouponUsages';
import { createCouponSchema, type CreateCouponFormData } from '../types/coupon.types';
import { CouponForm } from '../components/CouponForm';

function toLocalDatetime(iso: string): string {
  const d = new Date(iso);
  const offset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - offset).toISOString().slice(0, 16);
}

export default function AdminCouponEditPage() {
  const { id } = useParams<{ id: string }>();
  const couponId = Number(id);
  const { data: coupon, isLoading } = useAdminCoupon(couponId);
  const updateCoupon = useUpdateCoupon(couponId);
  const { params } = usePagination({ limit: 10 });
  const { data: usages } = useAdminCouponUsages(couponId, params);

  const form = useForm<CreateCouponFormData>({
    resolver: zodResolver(createCouponSchema),
    values: coupon ? {
      code: coupon.code,
      description: coupon.description ?? '',
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value,
      scope: coupon.scope,
      category_ids: coupon.category_ids ?? [],
      product_ids: coupon.product_ids ?? [],
      min_order_amount: coupon.min_order_amount,
      max_discount_amount: coupon.max_discount_amount,
      max_uses: coupon.max_uses,
      max_uses_per_user: coupon.max_uses_per_user,
      starts_at: toLocalDatetime(coupon.starts_at),
      expires_at: toLocalDatetime(coupon.expires_at),
    } : undefined,
  });

  function onSubmit(data: CreateCouponFormData) {
    const { code, ...rest } = data;
    updateCoupon.mutate({
      ...rest,
      description: rest.description || undefined,
      category_ids: rest.scope === 'categories' ? rest.category_ids : undefined,
      product_ids: rest.scope === 'products' ? rest.product_ids : undefined,
      min_order_amount: rest.min_order_amount ?? undefined,
      max_discount_amount: rest.max_discount_amount ?? undefined,
      max_uses: rest.max_uses ?? undefined,
    });
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!coupon) {
    return <div className="py-12 text-center text-slate-500">Coupon not found.</div>;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        to={ROUTES.ADMIN_COUPONS}
        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Coupons
      </Link>

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Edit: {coupon.code}</h1>
        <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${
          coupon.is_active ? 'text-emerald-700' : 'text-rose-700'
        }`}>
          <span className={`h-1.5 w-1.5 rounded-full ${coupon.is_active ? 'bg-emerald-500' : 'bg-rose-500'}`} />
          {coupon.is_active ? 'Active' : 'Inactive'}
        </span>
      </div>

      <div className="admin-card p-4">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <div>
            <span className="text-xs text-slate-400">Current Uses</span>
            <p className="font-medium text-slate-900">
              {coupon.current_uses}{coupon.max_uses ? ` / ${coupon.max_uses}` : ''}
            </p>
          </div>
          <div>
            <span className="text-xs text-slate-400">Per User</span>
            <p className="font-medium text-slate-900">{coupon.max_uses_per_user}</p>
          </div>
          <div>
            <span className="text-xs text-slate-400">Created</span>
            <p className="font-medium text-slate-900">{formatDate(coupon.created_at)}</p>
          </div>
          <div>
            <span className="text-xs text-slate-400">Scope</span>
            <p className="font-medium capitalize text-slate-900">{coupon.scope}</p>
          </div>
        </div>
      </div>

      {updateCoupon.isError && (
        <div className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">
          {updateCoupon.error instanceof ApiError
            ? updateCoupon.error.message
            : 'Failed to update coupon'}
        </div>
      )}

      {updateCoupon.isSuccess && (
        <div className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">
          Coupon updated successfully.
        </div>
      )}

      <div className="admin-card p-6">
        <CouponForm
          form={form}
          onSubmit={onSubmit}
          isPending={updateCoupon.isPending}
          submitLabel="Save Changes"
          isEdit
        />
      </div>

      {usages && usages.data.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-slate-900">
            Recent Usages ({usages.meta.total})
          </h2>
          <div className="admin-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="admin-table-header">
                    <th className="px-6 py-3.5 text-left">Order</th>
                    <th className="px-6 py-3.5 text-left">User</th>
                    <th className="px-6 py-3.5 text-left">Discount</th>
                    <th className="px-6 py-3.5 text-left">Status</th>
                    <th className="px-6 py-3.5 text-left">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {usages.data.map((usage) => (
                    <tr key={usage.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 text-sm">
                        <Link
                          to={ROUTES.ADMIN_ORDER_DETAIL(usage.order_id)}
                          className="font-mono text-teal-600 hover:text-teal-700"
                        >
                          #{usage.order_id}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {usage.user_email || `User #${usage.user_id}`}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {formatPrice(usage.discount_amount)}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${
                          usage.status === 'applied'
                            ? 'text-emerald-700'
                            : 'text-amber-700'
                        }`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${
                            usage.status === 'applied' ? 'bg-emerald-500' : 'bg-amber-500'
                          }`} />
                          {usage.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500">{formatDate(usage.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
