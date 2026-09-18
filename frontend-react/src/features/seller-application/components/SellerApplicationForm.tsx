import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Store } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useApplySeller } from '../hooks/useApplySeller';

const schema = z.object({
  shop_name: z.string().min(1, 'Please enter a shop name').max(100),
  phone: z
    .string()
    .min(1, 'Please enter a phone number')
    .regex(/^(0|\+84)\d{8,10}$/, 'Invalid phone number'),
  business_name: z.string().max(150).optional(),
  tax_id: z.string().max(50).optional(),
  description: z.string().max(2000).optional(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  /** Prefill from a rejected application when re-applying. */
  defaultValues?: Partial<FormData>;
}

export function SellerApplicationForm({ defaultValues }: Props) {
  const { t } = useTranslation('sellerApplication');
  const apply = useApplySeller();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      shop_name: '',
      phone: '',
      business_name: '',
      tax_id: '',
      description: '',
      ...defaultValues,
    },
  });

  const onSubmit = (values: FormData) =>
    apply.mutate({
      shop_name: values.shop_name,
      phone: values.phone,
      business_name: values.business_name || undefined,
      tax_id: values.tax_id || undefined,
      description: values.description || undefined,
    });

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="shop-card space-y-5 p-6"
    >
      <div className="flex items-center gap-2">
        <Store className="h-5 w-5 text-text-brand" />
        <h2 className="text-lg font-bold tracking-tight text-text-primary">
          {t('form.title')}
        </h2>
      </div>

      <Field label={t('form.fields.shopName.label')} error={errors.shop_name?.message}>
        <input {...register('shop_name')} className="shop-input" placeholder={t('form.fields.shopName.placeholder')} />
      </Field>

      <Field label={t('form.fields.phone.label')} error={errors.phone?.message}>
        <input {...register('phone')} className="shop-input" placeholder={t('form.fields.phone.placeholder')} inputMode="tel" />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label={t('form.fields.businessName.label')} error={errors.business_name?.message}>
          <input {...register('business_name')} className="shop-input" />
        </Field>
        <Field label={t('form.fields.taxId.label')} error={errors.tax_id?.message}>
          <input {...register('tax_id')} className="shop-input" />
        </Field>
      </div>

      <Field label={t('form.fields.description.label')} error={errors.description?.message}>
        <textarea
          {...register('description')}
          rows={4}
          className="shop-input"
          placeholder={t('form.fields.description.placeholder')}
        />
      </Field>

      <p className="text-xs text-text-muted">
        {t('form.note')}
      </p>

      <button
        type="submit"
        disabled={apply.isPending}
        className="flex items-center gap-2 rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-brand-hover disabled:opacity-50"
      >
        {apply.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
        {t('form.submit')}
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
      <label className="mb-1 block text-sm font-medium text-text-primary">
        {label}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-error-600">{error}</p>}
    </div>
  );
}
