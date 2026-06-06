import { useWatch, type UseFormReturn } from 'react-hook-form';
import type { CreateCouponFormData } from '../types/coupon.types';
import { MultiItemPicker } from './MultiItemPicker';
import { Button } from '@/common/components/ui/Button';

interface Props {
  form: UseFormReturn<CreateCouponFormData>;
  onSubmit: (data: CreateCouponFormData) => void;
  isPending: boolean;
  submitLabel: string;
  isEdit?: boolean;
}

export function CouponForm({ form, onSubmit, isPending, submitLabel, isEdit }: Props) {
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = form;

  const scope = useWatch({ control: form.control, name: 'scope' });
  const discountType = useWatch({ control: form.control, name: 'discount_type' });
  const categoryIds = useWatch({ control: form.control, name: 'category_ids' });
  const productIds = useWatch({ control: form.control, name: 'product_ids' });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="code" className="block text-sm font-medium text-slate-700">
            Code {isEdit && <span className="text-xs text-slate-400">(immutable)</span>}
          </label>
          <input
            id="code"
            {...register('code')}
            readOnly={isEdit}
            placeholder="e.g. SUMMER2026"
            className={`admin-input mt-1 uppercase ${isEdit ? 'cursor-not-allowed bg-slate-100 text-slate-500' : ''}`}
          />
          {errors.code && <p className="mt-1 text-xs text-rose-600">{errors.code.message}</p>}
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-slate-700">Description</label>
          <input
            id="description"
            {...register('description')}
            placeholder="Internal note"
            className="admin-input mt-1"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="discount_type" className="block text-sm font-medium text-slate-700">Discount Type</label>
          <select
            id="discount_type"
            {...register('discount_type')}
            className="admin-input mt-1"
          >
            <option value="percentage">Percentage (%)</option>
            <option value="fixed">Fixed (VND)</option>
          </select>
        </div>

        <div>
          <label htmlFor="discount_value" className="block text-sm font-medium text-slate-700">
            Discount Value {discountType === 'percentage' ? '(%)' : '(VND)'}
          </label>
          <input
            id="discount_value"
            type="number"
            step={discountType === 'percentage' ? '1' : '1000'}
            {...register('discount_value', { valueAsNumber: true })}
            className="admin-input mt-1"
          />
          {errors.discount_value && <p className="mt-1 text-xs text-rose-600">{errors.discount_value.message}</p>}
        </div>

        <div>
          <label htmlFor="scope" className="block text-sm font-medium text-slate-700">Scope</label>
          <select
            id="scope"
            {...register('scope')}
            className="admin-input mt-1"
          >
            <option value="all">All (entire order)</option>
            <option value="categories">Categories</option>
            <option value="products">Products</option>
          </select>
        </div>
      </div>

      {scope === 'categories' && (
        <div>
          <label className="block text-sm font-medium text-slate-700">Categories</label>
          <div className="mt-1">
            <MultiItemPicker
              type="categories"
              selectedIds={categoryIds ?? []}
              onChange={(ids) => setValue('category_ids', ids)}
            />
          </div>
          {errors.category_ids && <p className="mt-1 text-xs text-rose-600">{errors.category_ids.message}</p>}
        </div>
      )}

      {scope === 'products' && (
        <div>
          <label className="block text-sm font-medium text-slate-700">Products</label>
          <div className="mt-1">
            <MultiItemPicker
              type="products"
              selectedIds={productIds ?? []}
              onChange={(ids) => setValue('product_ids', ids)}
            />
          </div>
          {errors.product_ids && <p className="mt-1 text-xs text-rose-600">{errors.product_ids.message}</p>}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="min_order_amount" className="block text-sm font-medium text-slate-700">
            Min Order Amount <span className="text-xs text-slate-400">(optional)</span>
          </label>
          <input
            id="min_order_amount"
            type="number"
            step="1000"
            {...register('min_order_amount', { setValueAs: (v) => v === '' || v === null ? null : Number(v) })}
            className="admin-input mt-1"
          />
        </div>

        {discountType === 'percentage' && (
          <div>
            <label htmlFor="max_discount_amount" className="block text-sm font-medium text-slate-700">
              Max Discount Amount <span className="text-xs text-slate-400">(optional)</span>
            </label>
            <input
              id="max_discount_amount"
              type="number"
              step="1000"
              {...register('max_discount_amount', { setValueAs: (v) => v === '' || v === null ? null : Number(v) })}
              className="admin-input mt-1"
            />
          </div>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="max_uses" className="block text-sm font-medium text-slate-700">
            Max Total Uses <span className="text-xs text-slate-400">(empty = unlimited)</span>
          </label>
          <input
            id="max_uses"
            type="number"
            {...register('max_uses', { setValueAs: (v) => v === '' || v === null ? null : Number(v) })}
            className="admin-input mt-1"
          />
        </div>

        <div>
          <label htmlFor="max_uses_per_user" className="block text-sm font-medium text-slate-700">
            Max Uses Per User
          </label>
          <input
            id="max_uses_per_user"
            type="number"
            {...register('max_uses_per_user', { valueAsNumber: true })}
            className="admin-input mt-1"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="starts_at" className="block text-sm font-medium text-slate-700">Start Date</label>
          <input
            id="starts_at"
            type="datetime-local"
            {...register('starts_at')}
            className="admin-input mt-1"
          />
          {errors.starts_at && <p className="mt-1 text-xs text-rose-600">{errors.starts_at.message}</p>}
        </div>

        <div>
          <label htmlFor="expires_at" className="block text-sm font-medium text-slate-700">End Date</label>
          <input
            id="expires_at"
            type="datetime-local"
            {...register('expires_at')}
            className="admin-input mt-1"
          />
          {errors.expires_at && <p className="mt-1 text-xs text-rose-600">{errors.expires_at.message}</p>}
        </div>
      </div>

      {Object.keys(errors).length > 0 && (
        <div className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">
          Please fix the errors above before submitting.
        </div>
      )}

      <Button type="submit" loading={isPending} className="w-full">
        {submitLabel}
      </Button>
    </form>
  );
}
