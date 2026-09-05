import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import { useCreateWithdrawal } from '../hooks/useCreateWithdrawal';

interface Props {
  balance: number;
}

export function WithdrawalRequestForm({ balance }: Props) {
  const create = useCreateWithdrawal();

  const schema = z.object({
    amount: z
      .number({ message: 'Enter an amount' })
      .positive('Amount must be greater than 0')
      .max(balance, 'Exceeds available balance'),
    bank_name: z.string().min(1, 'Enter the bank name').max(100),
    bank_account_number: z.string().min(1, 'Enter the account number').max(50),
    bank_account_holder: z.string().min(1, 'Enter the account holder name').max(100),
  });
  type FormData = z.infer<typeof schema>;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      amount: undefined as unknown as number,
      bank_name: '',
      bank_account_number: '',
      bank_account_holder: '',
    },
  });

  const onSubmit = (values: FormData) =>
    create.mutate(values, { onSuccess: () => reset() });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="admin-card space-y-4 p-6">
      <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
        Request a withdrawal
      </h2>

      <Field label="Amount (₫)" error={errors.amount?.message}>
        <input
          type="number"
          step="any"
          {...register('amount', { valueAsNumber: true })}
          className="admin-input"
          placeholder="0"
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Bank" error={errors.bank_name?.message}>
          <input {...register('bank_name')} className="admin-input" placeholder="e.g. Vietcombank" />
        </Field>
        <Field label="Account number" error={errors.bank_account_number?.message}>
          <input {...register('bank_account_number')} className="admin-input" />
        </Field>
      </div>

      <Field label="Account holder" error={errors.bank_account_holder?.message}>
        <input {...register('bank_account_holder')} className="admin-input" />
      </Field>

      <button
        type="submit"
        disabled={create.isPending || balance <= 0}
        className="flex items-center gap-2 rounded-lg bg-amber-600 px-5 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-amber-700 disabled:opacity-50"
      >
        {create.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
        Submit request
      </button>
    </form>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
        {label}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{error}</p>}
    </div>
  );
}
