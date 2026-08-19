import { useParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Loader2, Lock } from 'lucide-react';
import { formatPrice, formatDate } from '@/common/utils/format.util';
import { ROUTES } from '@/common/constants/routes';
import { ApiError } from '@/core/api/api.types';
import { usePagination } from '@/common/hooks/usePagination';
import { useSellerCoupon, useSellerCouponUsages } from '../hooks/useSellerCoupons';
import { useUpdateSellerCoupon } from '../hooks/useSellerCouponMutations';
import { createCouponSchema, type CreateCouponFormData } from '../types/coupon.types';
import { CouponForm } from '../components/CouponForm';

function toLocalDatetime(iso: string): string {
  const d = new Date(iso);
  const offset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - offset).toISOString().slice(0, 16);
}

export default function SellerCouponEditPage() {
  const { id } = useParams<{ id: string }>();
  const couponId = Number(id);
  const { data: coupon, isLoading } = useSellerCoupon(couponId);
  const updateCoupon = useUpdateSellerCoupon(couponId);
  const { params } = usePagination({ limit: 10 });
  const { data: usages } = useSellerCouponUsages(couponId, params);

  const form = useForm<CreateCouponFormData>({
    resolver: zodResolver(createCouponSchema),
    values: coupon
      ? {
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
        }
      : undefined,
  });

  function onSubmit(data: CreateCouponFormData) {
    updateCoupon.mutate({
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
        to={ROUTES.SELLER_COUPONS}
        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Coupons
      </Link>

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          {coupon.admin_disabled ? 'View' : 'Edit'}: {coupon.code}
        </h1>
        {coupon.admin_disabled ? (
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
        )}
      </div>

      {coupon.admin_disabled ? (
        <div className="flex items-start gap-2 rounded-lg bg-rose-50 p-4 text-sm text-rose-700">
          <Lock className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            This coupon has been deactivated by an administrator and cannot be edited
            or re-enabled. Contact support if you believe this is a mistake.
          </p>
        </div>
      ) : (
        <>
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
              hideCategoryScope
              productSource="seller"
            />
          </div>
        </>
      )}

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
                          to={ROUTES.SELLER_ORDER_DETAIL(usage.order_id)}
                          className="font-mono text-amber-600 hover:text-amber-700"
                        >
                          #{usage.order_id}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {formatPrice(usage.discount_amount)}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${
                          usage.status === 'applied' ? 'text-emerald-700' : 'text-amber-700'
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
