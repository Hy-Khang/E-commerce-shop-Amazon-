import type { UseFormReturn } from 'react-hook-form';
import type { CreateCouponFormData, CouponScope } from '../types/coupon.types';

interface Props {
  form: UseFormReturn<CreateCouponFormData>;
  onSubmit: (data: CreateCouponFormData) => void;
  isPending: boolean;
  submitLabel: string;
  isEdit?: boolean;
}

function toLocalDatetime(iso: string | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  const offset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - offset).toISOString().slice(0, 16);
}

export function CouponForm({ form, onSubmit, isPending, submitLabel, isEdit }: Props) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = form;

  const scope = watch('scope');
  const discountType = watch('discount_type');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="code" className="block text-sm font-medium text-gray-700">
            Code {isEdit && <span className="text-xs text-gray-400">(immutable)</span>}
          </label>
          <input
            id="code"
            {...register('code')}
            disabled={isEdit}
            placeholder="e.g. SUMMER2026"
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm uppercase disabled:bg-gray-100 disabled:text-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          {errors.code && <p className="mt-1 text-xs text-red-600">{errors.code.message}</p>}
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
          <input
            id="description"
            {...register('description')}
            placeholder="Internal note"
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="discount_type" className="block text-sm font-medium text-gray-700">Discount Type</label>
          <select
            id="discount_type"
            {...register('discount_type')}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="percentage">Percentage (%)</option>
            <option value="fixed">Fixed (VND)</option>
          </select>
        </div>

        <div>
          <label htmlFor="discount_value" className="block text-sm font-medium text-gray-700">
            Discount Value {discountType === 'percentage' ? '(%)' : '(VND)'}
          </label>
          <input
            id="discount_value"
            type="number"
            step={discountType === 'percentage' ? '1' : '1000'}
            {...register('discount_value', { valueAsNumber: true })}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          {errors.discount_value && <p className="mt-1 text-xs text-red-600">{errors.discount_value.message}</p>}
        </div>

        <div>
          <label htmlFor="scope" className="block text-sm font-medium text-gray-700">Scope</label>
          <select
            id="scope"
            {...register('scope')}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">All (entire order)</option>
            <option value="categories">Categories</option>
            <option value="products">Products</option>
          </select>
        </div>
      </div>

      {scope === 'categories' && (
        <div>
          <label htmlFor="category_ids" className="block text-sm font-medium text-gray-700">
            Category IDs <span className="text-xs text-gray-400">(comma-separated)</span>
          </label>
          <input
            id="category_ids"
            placeholder="e.g. 5, 12, 18"
            defaultValue={watch('category_ids')?.join(', ') || ''}
            onChange={(e) => {
              const ids = e.target.value.split(',').map((s) => Number(s.trim())).filter(Boolean);
              form.setValue('category_ids', ids);
            }}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      )}

      {scope === 'products' && (
        <div>
          <label htmlFor="product_ids" className="block text-sm font-medium text-gray-700">
            Product IDs <span className="text-xs text-gray-400">(comma-separated)</span>
          </label>
          <input
            id="product_ids"
            placeholder="e.g. 101, 102, 103"
            defaultValue={watch('product_ids')?.join(', ') || ''}
            onChange={(e) => {
              const ids = e.target.value.split(',').map((s) => Number(s.trim())).filter(Boolean);
              form.setValue('product_ids', ids);
            }}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="min_order_amount" className="block text-sm font-medium text-gray-700">
            Min Order Amount <span className="text-xs text-gray-400">(optional)</span>
          </label>
          <input
            id="min_order_amount"
            type="number"
            step="1000"
            {...register('min_order_amount', { setValueAs: (v) => v === '' || v === null ? null : Number(v) })}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {discountType === 'percentage' && (
          <div>
            <label htmlFor="max_discount_amount" className="block text-sm font-medium text-gray-700">
              Max Discount Amount <span className="text-xs text-gray-400">(optional)</span>
            </label>
            <input
              id="max_discount_amount"
              type="number"
              step="1000"
              {...register('max_discount_amount', { setValueAs: (v) => v === '' || v === null ? null : Number(v) })}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="max_uses" className="block text-sm font-medium text-gray-700">
            Max Total Uses <span className="text-xs text-gray-400">(empty = unlimited)</span>
          </label>
          <input
            id="max_uses"
            type="number"
            {...register('max_uses', { setValueAs: (v) => v === '' || v === null ? null : Number(v) })}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="max_uses_per_user" className="block text-sm font-medium text-gray-700">
            Max Uses Per User
          </label>
          <input
            id="max_uses_per_user"
            type="number"
            {...register('max_uses_per_user', { valueAsNumber: true })}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="starts_at" className="block text-sm font-medium text-gray-700">Start Date</label>
          <input
            id="starts_at"
            type="datetime-local"
            {...register('starts_at')}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          {errors.starts_at && <p className="mt-1 text-xs text-red-600">{errors.starts_at.message}</p>}
        </div>

        <div>
          <label htmlFor="expires_at" className="block text-sm font-medium text-gray-700">End Date</label>
          <input
            id="expires_at"
            type="datetime-local"
            {...register('expires_at')}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          {errors.expires_at && <p className="mt-1 text-xs text-red-600">{errors.expires_at.message}</p>}
        </div>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {isPending ? 'Saving...' : submitLabel}
      </button>
    </form>
  );
}
