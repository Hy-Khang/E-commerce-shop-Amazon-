import { useForm, useWatch, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Percent, Loader2 } from 'lucide-react';
import { Button } from '@/common/components/ui/Button';
import {
  useCommissionSettings,
  useUpdateCommissionSettings,
} from '../hooks/useCommissionSettings';
import { CommissionCategoryRates } from '../components/CommissionCategoryRates';
import { PercentField } from '../components/PercentField';

const schema = z.object({
  enabled: z.boolean(),
  mode: z.enum(['flat', 'category']),
  rate_percent: z.number({ message: 'Required' }).min(0).max(100),
});
type FormData = z.infer<typeof schema>;

export default function AdminCommissionSettingsPage() {
  const { data, isLoading } = useCommissionSettings();
  const update = useUpdateCommissionSettings();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isDirty },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { enabled: true, mode: 'flat', rate_percent: 10 },
    // Sync server config reactively (and notify `useWatch` below). Using the
    // `values` prop instead of a `useEffect(reset)` avoids a race where the
    // effect-driven reset lands after `useWatch` subscribes, leaving the
    // category-rates section hidden until a full page reload.
    values: data,
  });

  const mode = useWatch({ control, name: 'mode' });
  const onSubmit = (values: FormData) => update.mutate(values);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400 dark:text-slate-500" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-2">
        <Percent className="h-6 w-6 text-teal-600" />
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Platform commission
        </h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="admin-card space-y-6 p-6">
        <label className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Enable commission
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              When off, the platform charges no commission and credits no net revenue to wallets.
            </p>
          </div>
          <input
            type="checkbox"
            {...register('enabled')}
            className="h-5 w-5 accent-teal-600"
          />
        </label>

        <div>
          <label className="block text-sm font-semibold text-slate-900 dark:text-slate-100">
            Calculation mode
          </label>
          <p className="mb-2 text-xs text-slate-500 dark:text-slate-400">
            Flat (single rate) or per-category (per-category rate + the general rate as fallback).
          </p>
          <select {...register('mode')} className="admin-input">
            <option value="flat">Flat</option>
            <option value="category">Per category</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-900 dark:text-slate-100">
            General commission rate (%)
          </label>
          <p className="mb-2 text-xs text-slate-500 dark:text-slate-400">
            Applied platform-wide (flat mode) or as the fallback rate (category mode).
          </p>
          <Controller
            control={control}
            name="rate_percent"
            render={({ field }) => (
              <PercentField
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
              />
            )}
          />
          {errors.rate_percent && (
            <p className="mt-1 text-xs text-rose-600">
              {errors.rate_percent.message}
            </p>
          )}
        </div>

        <div className="flex justify-end">
          <Button
            type="submit"
            variant="primary"
            disabled={update.isPending || !isDirty}
          >
            {update.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Save changes
          </Button>
        </div>
      </form>

      {mode === 'category' && <CommissionCategoryRates />}
    </div>
  );
}
