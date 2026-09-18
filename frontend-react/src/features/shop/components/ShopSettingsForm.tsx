import { useState } from 'react';
import { useForm, useWatch, type Control, type UseFormRegister, type UseFormSetValue, type FieldErrors } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ImageUpload } from '@/features/product';
import { AddressMapPicker, LocationPicker, geocodeAddress, type LocationValue } from '@/features/user-profile';
import { ApiError } from '@/core/api/api.types';
import { useMyShop, useCreateMyShop, useUpdateMyShop } from '../hooks/useMyShop';
import { ShopProfilePreview } from './ShopProfilePreview';
import {
  createShopSchema,
  updateShopSchema,
  type CreateShopFormData,
  type UpdateShopFormData,
} from '../types/shop.types';

const DESCRIPTION_MAX = 2000;

/** Shared editable-field shape — both create & update forms are compatible with it. */
type ShopFormValues = {
  name: string;
  description?: string;
  logo_url?: string;
  banner_url?: string;
  pickup_address?: string;
  latitude?: number;
  longitude?: number;
};

export function ShopSettingsForm() {
  const { data: shop, isLoading, error: fetchError } = useMyShop();
  const createShop = useCreateMyShop();
  const updateShop = useUpdateMyShop();

  const isNew = !shop && fetchError instanceof ApiError && fetchError.code === 'SHOP_004';

  if (isLoading) {
    return <div className="py-12 text-center text-slate-500 dark:text-slate-400">Loading shop settings...</div>;
  }

  if (!shop && !isNew) {
    return <div className="py-12 text-center text-slate-500 dark:text-slate-400">Unable to load shop data.</div>;
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
    control,
    setValue,
    formState: { errors },
  } = useForm<CreateShopFormData>({
    resolver: zodResolver(createShopSchema),
    defaultValues: { name: '', description: '', logo_url: '', banner_url: '', pickup_address: '', latitude: undefined, longitude: undefined },
  });

  const [name, logoUrl, bannerUrl] = useWatch({ control, name: ['name', 'logo_url', 'banner_url'] });

  function onSubmit(data: CreateShopFormData) {
    create.mutate({
      name: data.name,
      description: data.description || undefined,
      logo_url: data.logo_url || undefined,
      banner_url: data.banner_url || undefined,
      pickup_address: data.pickup_address || undefined,
      latitude: data.latitude,
      longitude: data.longitude,
    });
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Set Up Your Shop</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Create your shop profile to start selling.</p>
      </div>

      <ShopProfilePreview name={name} logoUrl={logoUrl} bannerUrl={bannerUrl} />

      {create.error instanceof ApiError && (
        <div className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">{create.error.message}</div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="admin-card space-y-5 p-6">
        <ShopFormFields
          register={register as unknown as UseFormRegister<ShopFormValues>}
          control={control as unknown as Control<ShopFormValues>}
          setValue={setValue as unknown as UseFormSetValue<ShopFormValues>}
          errors={errors as FieldErrors<ShopFormValues>}
          initialPickupAddress=""
        />
        <button
          type="submit"
          disabled={create.isPending}
          className="rounded-lg bg-amber-600 px-5 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-amber-700 disabled:opacity-50"
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
    control,
    setValue,
    formState: { errors, isDirty },
  } = useForm<UpdateShopFormData>({
    resolver: zodResolver(updateShopSchema),
    defaultValues: {
      name: shop.name,
      description: shop.description ?? '',
      logo_url: shop.logo_url ?? '',
      banner_url: shop.banner_url ?? '',
      pickup_address: shop.pickup_address ?? '',
      latitude: shop.latitude ?? undefined,
      longitude: shop.longitude ?? undefined,
    },
  });

  const [name, logoUrl, bannerUrl] = useWatch({ control, name: ['name', 'logo_url', 'banner_url'] });

  function onSubmit(data: UpdateShopFormData) {
    update.mutate({
      name: data.name,
      description: data.description || undefined,
      logo_url: data.logo_url || undefined,
      banner_url: data.banner_url || undefined,
      pickup_address: data.pickup_address || undefined,
      latitude: data.latitude,
      longitude: data.longitude,
    });
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Shop Settings</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Manage how your storefront appears to shoppers.</p>
      </div>

      <ShopProfilePreview
        name={name}
        logoUrl={logoUrl}
        bannerUrl={bannerUrl}
        slug={shop.slug}
        status={shop.status}
      />

      {update.error instanceof ApiError && (
        <div className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">{update.error.message}</div>
      )}

      {update.isSuccess && (
        <div className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">Shop updated successfully.</div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="admin-card space-y-5 p-6">
        <ShopFormFields
          register={register as unknown as UseFormRegister<ShopFormValues>}
          control={control as unknown as Control<ShopFormValues>}
          setValue={setValue as unknown as UseFormSetValue<ShopFormValues>}
          errors={errors as FieldErrors<ShopFormValues>}
          initialPickupAddress={shop.pickup_address ?? ''}
        />
        <button
          type="submit"
          disabled={update.isPending || !isDirty}
          className="rounded-lg bg-amber-600 px-5 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-amber-700 disabled:opacity-50"
        >
          {update.isPending ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </div>
  );
}

function ShopFormFields({
  register,
  control,
  setValue,
  errors,
  initialPickupAddress,
}: {
  register: UseFormRegister<ShopFormValues>;
  control: Control<ShopFormValues>;
  setValue: UseFormSetValue<ShopFormValues>;
  errors: FieldErrors<ShopFormValues>;
  initialPickupAddress: string;
}) {
  const description = useWatch({ control, name: 'description' }) ?? '';
  const logoUrl = useWatch({ control, name: 'logo_url' });
  const bannerUrl = useWatch({ control, name: 'banner_url' });

  return (
    <>
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Shop Name</label>
        <input
          id="name"
          {...register('name')}
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        />
        {errors.name?.message && <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{errors.name.message}</p>}
      </div>

      <div>
        <div className="flex items-center justify-between">
          <label htmlFor="description" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Description</label>
          <span className={`text-xs ${description.length > DESCRIPTION_MAX ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400 dark:text-slate-500'}`}>
            {description.length}{DESCRIPTION_MAX ? ` / ${DESCRIPTION_MAX}` : ''}
          </span>
        </div>
        <textarea
          id="description"
          rows={4}
          {...register('description')}
          placeholder="Tell shoppers what your shop is about..."
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        />
        {errors.description?.message && <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{errors.description.message}</p>}
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <ImageUpload
          label="Logo"
          value={logoUrl || undefined}
          onUploaded={(url) => setValue('logo_url', url, { shouldDirty: true })}
          onClear={() => setValue('logo_url', '', { shouldDirty: true })}
        />
        <ImageUpload
          label="Banner"
          value={bannerUrl || undefined}
          onUploaded={(url) => setValue('banner_url', url, { shouldDirty: true })}
          onClear={() => setValue('banner_url', '', { shouldDirty: true })}
        />
      </div>

      <ShopPickupField
        control={control}
        setValue={setValue}
        initialPickupAddress={initialPickupAddress}
      />
    </>
  );
}

/**
 * Pickup location editor — mirrors the customer address form: a cascading
 * Province/Ward picker + an "address details" line combine into the single
 * `pickup_address` string, and picking a ward auto-geocodes the map marker
 * (which the seller can then fine-tune by clicking). Only writes to the form
 * (marking it dirty) when the seller actually changes something, so an
 * untouched shop keeps its saved pickup address.
 */
function ShopPickupField({
  control,
  setValue,
  initialPickupAddress,
}: {
  control: Control<ShopFormValues>;
  setValue: UseFormSetValue<ShopFormValues>;
  initialPickupAddress: string;
}) {
  const latitude = useWatch({ control, name: 'latitude' });
  const longitude = useWatch({ control, name: 'longitude' });

  const [location, setLocation] = useState<LocationValue>({ province: null, ward: null });
  const [detail, setDetail] = useState('');
  const [flyTarget, setFlyTarget] = useState<[number, number] | null>(null);

  const cityValue =
    location.ward && location.province
      ? `${location.ward.name}, ${location.province.name}`
      : location.province
        ? location.province.name
        : '';

  function commit(nextDetail: string, city: string) {
    const combined = [nextDetail, city].filter(Boolean).join(', ');
    setValue('pickup_address', combined, { shouldDirty: true });
  }

  async function autoGeocode(city: string) {
    try {
      const hit = await geocodeAddress('', city);
      if (hit) {
        setValue('latitude', hit.lat, { shouldDirty: true });
        setValue('longitude', hit.lng, { shouldDirty: true });
        setFlyTarget([hit.lat, hit.lng]);
      }
    } catch {
      // Silent — the seller can still click the map to pin the location.
    }
  }

  function handleLocationChange(next: LocationValue) {
    setLocation(next);
    const city =
      next.ward && next.province
        ? `${next.ward.name}, ${next.province.name}`
        : next.province
          ? next.province.name
          : '';
    commit(detail, city);
    if (next.ward && next.province) autoGeocode(city);
  }

  return (
    <div className="border-t border-slate-200 pt-5 dark:border-slate-800">
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Pickup Location</label>
      <p className="mt-0.5 mb-3 text-xs text-slate-500 dark:text-slate-400">
        Where couriers pick up orders. Choosing a ward pins it on the map — the package starts here in order tracking.
      </p>

      <div className="space-y-3">
        <LocationPicker
          value={location}
          onChange={handleLocationChange}
          initialDisplayText={initialPickupAddress}
          variant="portal"
        />

        <div>
          <label htmlFor="pickup_detail" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Address details
          </label>
          <input
            id="pickup_detail"
            value={detail}
            onChange={(e) => {
              setDetail(e.target.value);
              commit(e.target.value, cityValue);
            }}
            placeholder="House number, street name..."
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          />
        </div>

        <AddressMapPicker
          latitude={latitude ?? null}
          longitude={longitude ?? null}
          addressLine={detail}
          city={cityValue}
          externalFlyTo={flyTarget}
          onChange={(lat, lng) => {
            setValue('latitude', lat, { shouldDirty: true });
            setValue('longitude', lng, { shouldDirty: true });
          }}
        />
      </div>
    </div>
  );
}
