import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { ROUTES } from '@/common/constants/routes';
import { ApiError } from '@/core/api/api.types';
import { useMyShop } from '@/features/shop';
import { useCreateSellerCoupon } from '../hooks/useSellerCouponMutations';
import { createCouponSchema, type CreateCouponFormData } from '../types/coupon.types';
import { CouponForm } from '../components/CouponForm';

export default function SellerCouponCreatePage() {
  const { data: shop } = useMyShop();
  const createCoupon = useCreateSellerCoupon();

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
    });
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
          hideCategoryScope
          productSource="seller"
          codePrefix={shop?.slug ? shop.slug.toUpperCase() : undefined}
        />
      </div>
    </div>
  );
}
