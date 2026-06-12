import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ApiError } from '@/core/api/api.types';
import { useMyShop, useCreateMyShop, useUpdateMyShop } from '../hooks/useMyShop';
import {
  createShopSchema,
  updateShopSchema,
  type CreateShopFormData,
  type UpdateShopFormData,
  SHOP_STATUS_LABELS,
} from '../types/shop.types';

export function ShopSettingsForm() {
  const { data: shop, isLoading, error: fetchError } = useMyShop();
  const createShop = useCreateMyShop();
  const updateShop = useUpdateMyShop();

  const isNew = !shop && fetchError instanceof ApiError && fetchError.code === 'SHOP_004';

  if (isLoading) {
    return <div className="py-12 text-center text-gray-500">Loading shop settings...</div>;
  }

  if (!shop && !isNew) {
    return <div className="py-12 text-center text-gray-500">Unable to load shop data.</div>;
  }

  if (isNew) {
    return <CreateShopView create={createShop} />;
  }

  return <UpdateShopView shop={shop!} update={updateShop} />;
}

function CreateShopView({ create }: { create: ReturnType<typeof useCreateMyShop> }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateShopFormData>({
    resolver: zodResolver(createShopSchema),
  });

  function onSubmit(data: CreateShopFormData) {
    create.mutate({
      name: data.name,
      description: data.description || undefined,
      logo_url: data.logo_url || undefined,
      banner_url: data.banner_url || undefined,
    });
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Set Up Your Shop</h2>
        <p className="mt-1 text-sm text-gray-500">Create your shop profile to start selling.</p>
      </div>

      {create.error instanceof ApiError && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{create.error.message}</div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <FieldInput id="name" label="Shop Name" register={register('name')} error={errors.name?.message} />
        <FieldTextarea id="description" label="Description" register={register('description')} />
        <FieldInput id="logo_url" label="Logo URL" register={register('logo_url')} error={errors.logo_url?.message} placeholder="https://..." />
        <FieldInput id="banner_url" label="Banner URL" register={register('banner_url')} error={errors.banner_url?.message} placeholder="https://..." />

        <button
          type="submit"
          disabled={create.isPending}
          className="w-full rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50"
        >
          {create.isPending ? 'Creating...' : 'Create Shop'}
        </button>
      </form>
    </div>
  );
}

function UpdateShopView({
  shop,
  update,
}: {
  shop: NonNullable<ReturnType<typeof useMyShop>['data']>;
  update: ReturnType<typeof useUpdateMyShop>;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<UpdateShopFormData>({
    resolver: zodResolver(updateShopSchema),
    defaultValues: {
      name: shop.name,
      description: shop.description ?? '',
      logo_url: shop.logo_url ?? '',
      banner_url: shop.banner_url ?? '',
    },
  });

  function onSubmit(data: UpdateShopFormData) {
    update.mutate({
      name: data.name,
      description: data.description || undefined,
      logo_url: data.logo_url || undefined,
      banner_url: data.banner_url || undefined,
    });
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Shop Settings</h2>
        <StatusBadge status={shop.status} />
      </div>

      <div className="rounded-md bg-gray-50 p-3 text-sm text-gray-600">
        Slug: <span className="font-mono text-gray-900">{shop.slug}</span>
      </div>

      {update.error instanceof ApiError && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{update.error.message}</div>
      )}

      {update.isSuccess && (
        <div className="rounded-md bg-green-50 p-3 text-sm text-green-700">Shop updated successfully.</div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <FieldInput id="name" label="Shop Name" register={register('name')} error={errors.name?.message} />
        <FieldTextarea id="description" label="Description" register={register('description')} />
        <FieldInput id="logo_url" label="Logo URL" register={register('logo_url')} error={errors.logo_url?.message} placeholder="https://..." />
        <FieldInput id="banner_url" label="Banner URL" register={register('banner_url')} error={errors.banner_url?.message} placeholder="https://..." />

        <button
          type="submit"
          disabled={update.isPending || !isDirty}
          className="w-full rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50"
        >
          {update.isPending ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    active: 'bg-green-100 text-green-800',
    pending_verification: 'bg-yellow-100 text-yellow-800',
    suspended: 'bg-red-100 text-red-800',
    banned: 'bg-gray-100 text-gray-800',
  };

  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${colors[status] ?? 'bg-gray-100 text-gray-800'}`}>
      {SHOP_STATUS_LABELS[status as keyof typeof SHOP_STATUS_LABELS] ?? status}
    </span>
  );
}

function FieldInput({
  id,
  label,
  register,
  error,
  placeholder,
}: {
  id: string;
  label: string;
  register: ReturnType<ReturnType<typeof useForm>['register']>;
  error?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700">{label}</label>
      <input
        id={id}
        {...register}
        placeholder={placeholder}
        className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
      />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

function FieldTextarea({
  id,
  label,
  register,
}: {
  id: string;
  label: string;
  register: ReturnType<ReturnType<typeof useForm>['register']>;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700">{label}</label>
      <textarea
        id={id}
        rows={4}
        {...register}
        className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
      />
    </div>
  );
}
