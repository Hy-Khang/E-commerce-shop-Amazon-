import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Coins, Loader2 } from 'lucide-react';
import { Button } from '@/common/components/ui/Button';
import { useCoinSettings } from '../hooks/useCoinSettings';
import { useUpdateCoinSettings } from '../hooks/useUpdateCoinSettings';

const schema = z.object({
  enabled: z.boolean(),
  earn_rate_percent: z.number({ message: 'Bắt buộc' }).min(0).max(100),
  redeem_max_percent: z.number({ message: 'Bắt buộc' }).min(0).max(100),
  expiry_days: z.number({ message: 'Bắt buộc' }).int().min(1).max(3650),
});

type FormData = z.infer<typeof schema>;

export default function AdminCoinSettingsPage() {
  const { data, isLoading } = useCoinSettings();
  const update = useUpdateCoinSettings();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      enabled: true,
      earn_rate_percent: 1,
      redeem_max_percent: 50,
      expiry_days: 90,
    },
  });

  useEffect(() => {
    if (data) reset(data);
  }, [data, reset]);

  const onSubmit = (values: FormData) => update.mutate(values);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400 dark:text-slate-500" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex items-center gap-2">
        <Coins className="h-6 w-6 text-teal-600" />
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Coin Settings
        </h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="admin-card space-y-6 p-6">
        {/* Enabled */}
        <label className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Enable coin feature
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              When off, customers can neither earn nor redeem Coins.
            </p>
          </div>
          <input
            type="checkbox"
            {...register('enabled')}
            className="h-5 w-5 accent-teal-600"
          />
        </label>

        <Field
          label="Earn rate (%)"
          hint="% of an order's post-discount items total awarded as Coins on completion."
          error={errors.earn_rate_percent?.message}
        >
          <input
            type="number"
            step="0.01"
            min={0}
            max={100}
            {...register('earn_rate_percent', { valueAsNumber: true })}
            className="admin-input"
          />
        </Field>

        <Field
          label="Max redeem (%)"
          hint="Max share of a checkout's items total payable with Coins."
          error={errors.redeem_max_percent?.message}
        >
          <input
            type="number"
            step="0.01"
            min={0}
            max={100}
            {...register('redeem_max_percent', { valueAsNumber: true })}
            className="admin-input"
          />
        </Field>

        <Field
          label="Expiry (days)"
          hint="Days until an earned Coins batch expires."
          error={errors.expiry_days?.message}
        >
          <input
            type="number"
            step="1"
            min={1}
            max={3650}
            {...register('expiry_days', { valueAsNumber: true })}
            className="admin-input"
          />
        </Field>

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
    </div>
  );
}

function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-slate-900 dark:text-slate-100">
        {label}
      </label>
      <p className="mb-2 text-xs text-slate-500 dark:text-slate-400">{hint}</p>
      {children}
      {error && <p className="mt-1 text-xs text-rose-600">{error}</p>}
    </div>
  );
}
