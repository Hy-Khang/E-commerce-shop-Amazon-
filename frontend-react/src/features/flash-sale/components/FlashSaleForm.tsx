import type { UseFormReturn } from 'react-hook-form';
import { Loader2 } from 'lucide-react';
import type { FlashSaleFormData } from '../types/flash-sale.types';

interface Props {
  form: UseFormReturn<FlashSaleFormData>;
  onSubmit: (data: FlashSaleFormData) => void;
  isPending: boolean;
  submitLabel: string;
  isEdit?: boolean;
}

export function FlashSaleForm({ form, onSubmit, isPending, submitLabel, isEdit }: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = form;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
          Campaign name
        </label>
        <input type="text" className="admin-input" placeholder="Flash Sale Cuối Tuần" {...register('name')} />
        {errors.name && <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{errors.name.message}</p>}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Registration opens
          </label>
          <input type="datetime-local" className="admin-input" {...register('registration_starts_at')} />
          {errors.registration_starts_at && (
            <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{errors.registration_starts_at.message}</p>
          )}
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Registration deadline
          </label>
          <input type="datetime-local" className="admin-input" {...register('registration_ends_at')} />
          {errors.registration_ends_at && (
            <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{errors.registration_ends_at.message}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Sale starts at
          </label>
          <input type="datetime-local" className="admin-input" {...register('starts_at')} />
          {errors.starts_at && (
            <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{errors.starts_at.message}</p>
          )}
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Sale ends at
          </label>
          <input type="datetime-local" className="admin-input" {...register('ends_at')} />
          {errors.ends_at && (
            <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{errors.ends_at.message}</p>
          )}
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
          Minimum discount (%)
        </label>
        <input
          type="number"
          min={0}
          max={100}
          step="0.01"
          className="admin-input"
          placeholder="10"
          {...register('min_discount_percent', { valueAsNumber: true })}
        />
        {errors.min_discount_percent && (
          <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{errors.min_discount_percent.message}</p>
        )}
        <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
          Sellers must discount at least this much to register a product.
        </p>
      </div>

      {isEdit && (
        <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
          <input type="checkbox" className="h-4 w-4 rounded border-slate-300" {...register('is_active')} />
          Active
        </label>
      )}

      <div className="flex justify-end gap-2 pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-teal-700 disabled:opacity-50"
        >
          {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
