import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { ROUTES } from '@/common/constants/routes';
import { ApiError } from '@/core/api/api.types';
import { useCreateCoupon } from '../hooks/useCreateCoupon';
import { createCouponSchema, type CreateCouponFormData } from '../types/coupon.types';
import { CouponForm } from '../components/CouponForm';

export default function AdminCouponCreatePage() {
  const createCoupon = useCreateCoupon();

  const form = useForm<CreateCouponFormData>({
    resolver: zodResolver(createCouponSchema),
    defaultValues: {
      scope: 'all',
      discount_type: 'percentage',
      max_uses_per_user: 1,
    },
  });

  function onSubmit(data: CreateCouponFormData) {
    createCoupon.mutate({
      ...data,
      description: data.description || undefined,
      category_ids: data.scope === 'categories' ? data.category_ids : undefined,
      product_ids: data.scope === 'products' ? data.product_ids : undefined,
      min_order_amount: data.min_order_amount ?? undefined,
      max_discount_amount: data.max_discount_amount ?? undefined,
      max_uses: data.max_uses ?? undefined,
    });
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

      <h1 className="text-2xl font-bold tracking-tight text-slate-900">Create Coupon</h1>

      {createCoupon.error instanceof ApiError && (
        <div className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">
          {createCoupon.error.message}
        </div>
      )}

      <div className="admin-card p-6">
        <CouponForm
          form={form}
          onSubmit={onSubmit}
          isPending={createCoupon.isPending}
          submitLabel="Create Coupon"
        />
      </div>
    </div>
  );
}
