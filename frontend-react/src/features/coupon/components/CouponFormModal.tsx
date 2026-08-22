import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Lock } from 'lucide-react';
import { Drawer } from '@/common/components/ui/Drawer';
import { ApiError } from '@/core/api/api.types';
import { CouponForm } from './CouponForm';
import type { ProductPickerSource } from './MultiItemPicker';
import { createCouponSchema, type CreateCouponFormData, type Coupon } from '../types/coupon.types';

function toLocalDatetime(iso: string): string {
  const d = new Date(iso);
  const offset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - offset).toISOString().slice(0, 16);
}

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  onSubmit: (data: CreateCouponFormData) => void;
  isPending: boolean;
  error: Error | null;
  /** Coupon detail for edit hydration; omit/null for create. */
  detail?: Coupon | null;
  /** Show a spinner while the edit detail is being fetched. */
  isLoadingDetail?: boolean;
  isEdit?: boolean;
  hideCategoryScope?: boolean;
  productSource?: ProductPickerSource;
  codePrefix?: string;
  /** Render a read-only locked notice instead of the form (admin-disabled shop coupon). */
  locked?: boolean;
}

export function CouponFormModal({
  open,
  onClose,
  title,
  onSubmit,
  isPending,
  error,
  detail,
  isLoadingDetail,
  isEdit,
  hideCategoryScope,
  productSource,
  codePrefix,
  locked,
}: Props) {
  return (
    <Drawer open={open} onClose={onClose} title={title} variant="modal" size="xl">
      {error instanceof ApiError && (
        <div className="mb-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error.message}</div>
      )}

      {isEdit && isLoadingDetail ? (
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
        </div>
      ) : locked ? (
        <div className="flex items-start gap-2 rounded-lg bg-rose-50 p-4 text-sm text-rose-700">
          <Lock className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            This coupon has been deactivated by an administrator and cannot be edited or
            re-enabled. Contact support if you believe this is a mistake.
          </p>
        </div>
      ) : isEdit && !detail ? (
        <p className="py-10 text-center text-sm text-slate-500">Coupon not found.</p>
      ) : (
        // Mounted only while the drawer is open (and, for edit, after the detail
        // has loaded) so the form is freshly seeded on every open.
        <CouponFormBody
          detail={detail}
          onSubmit={onSubmit}
          isPending={isPending}
          isEdit={isEdit}
          hideCategoryScope={hideCategoryScope}
          productSource={productSource}
          codePrefix={codePrefix}
        />
      )}
    </Drawer>
  );
}

interface BodyProps {
  detail?: Coupon | null;
  onSubmit: (data: CreateCouponFormData) => void;
  isPending: boolean;
  isEdit?: boolean;
  hideCategoryScope?: boolean;
  productSource?: ProductPickerSource;
  codePrefix?: string;
}

function CouponFormBody({
  detail,
  onSubmit,
  isPending,
  isEdit,
  hideCategoryScope,
  productSource,
  codePrefix,
}: BodyProps) {
  const form = useForm<CreateCouponFormData>({
    resolver: zodResolver(createCouponSchema),
    defaultValues: detail
      ? {
          code: detail.code,
          description: detail.description ?? '',
          discount_type: detail.discount_type,
          discount_value: detail.discount_value,
          scope: detail.scope,
          category_ids: detail.category_ids ?? [],
          product_ids: detail.product_ids ?? [],
          min_order_amount: detail.min_order_amount,
          max_discount_amount: detail.max_discount_amount,
          max_uses: detail.max_uses,
          max_uses_per_user: detail.max_uses_per_user,
          starts_at: toLocalDatetime(detail.starts_at),
          expires_at: toLocalDatetime(detail.expires_at),
        }
      : {
          scope: 'all',
          discount_type: 'percentage',
          max_uses_per_user: 1,
        },
  });

  return (
    <CouponForm
      form={form}
      onSubmit={onSubmit}
      isPending={isPending}
      submitLabel={isEdit ? 'Save Changes' : 'Create Coupon'}
      isEdit={isEdit}
      hideCategoryScope={hideCategoryScope}
      productSource={productSource}
      codePrefix={codePrefix}
    />
  );
}
