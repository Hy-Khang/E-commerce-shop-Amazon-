import { useParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
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
      category_ids: coupon.category_ids,
      product_ids: coupon.product_ids,
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
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!coupon) {
    return <div className="py-12 text-center text-gray-500">Coupon not found.</div>;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Edit: {coupon.code}</h1>
        <div className="flex items-center gap-3">
          <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
            coupon.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {coupon.is_active ? 'Active' : 'Inactive'}
          </span>
          <Link to={ROUTES.ADMIN_COUPONS} className="text-sm text-gray-600 hover:text-gray-900">
            Back to list
          </Link>
        </div>
      </div>

      <div className="rounded-md bg-gray-50 p-4 text-sm text-gray-600">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <div>
            <span className="text-xs text-gray-400">Current Uses</span>
            <p className="font-medium text-gray-900">
              {coupon.current_uses}{coupon.max_uses ? ` / ${coupon.max_uses}` : ''}
            </p>
          </div>
          <div>
            <span className="text-xs text-gray-400">Per User</span>
            <p className="font-medium text-gray-900">{coupon.max_uses_per_user}</p>
          </div>
          <div>
            <span className="text-xs text-gray-400">Created</span>
            <p className="font-medium text-gray-900">{formatDate(coupon.created_at)}</p>
          </div>
          <div>
            <span className="text-xs text-gray-400">Scope</span>
            <p className="font-medium text-gray-900 capitalize">{coupon.scope}</p>
          </div>
        </div>
      </div>

      {updateCoupon.error instanceof ApiError && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
          {updateCoupon.error.message}
        </div>
      )}

      {updateCoupon.isSuccess && (
        <div className="rounded-md bg-green-50 p-3 text-sm text-green-700">
          Coupon updated successfully.
        </div>
      )}

      <CouponForm
        form={form}
        onSubmit={onSubmit}
        isPending={updateCoupon.isPending}
        submitLabel="Save Changes"
        isEdit
      />

      {usages && usages.data.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-gray-900">
            Recent Usages ({usages.meta.total})
          </h2>
          <div className="overflow-x-auto rounded-lg border">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500">Order</th>
                  <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500">User</th>
                  <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500">Discount</th>
                  <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500">Status</th>
                  <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {usages.data.map((usage) => (
                  <tr key={usage.id}>
                    <td className="px-3 py-2 text-sm">
                      <Link
                        to={ROUTES.ADMIN_ORDER_DETAIL(usage.order_id)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        #{usage.order_id}
                      </Link>
                    </td>
                    <td className="px-3 py-2 text-sm text-gray-600">
                      {usage.user_email || `User #${usage.user_id}`}
                    </td>
                    <td className="px-3 py-2 text-sm text-gray-600">
                      {formatPrice(usage.discount_amount)}
                    </td>
                    <td className="px-3 py-2">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                        usage.status === 'applied'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {usage.status}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-xs text-gray-500">{formatDate(usage.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
