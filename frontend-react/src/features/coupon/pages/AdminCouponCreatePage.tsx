import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Create Coupon</h1>
        <Link to={ROUTES.ADMIN_COUPONS} className="text-sm text-gray-600 hover:text-gray-900">
          Back to list
        </Link>
      </div>

      {createCoupon.error instanceof ApiError && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
          {createCoupon.error.message}
        </div>
      )}

      <CouponForm
        form={form}
        onSubmit={onSubmit}
        isPending={createCoupon.isPending}
        submitLabel="Create Coupon"
      />
    </div>
  );
}
