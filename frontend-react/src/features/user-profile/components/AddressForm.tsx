import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { addressSchema, type AddressFormData, type Address } from '../types/user-profile.types';
import { ApiError } from '@/core/api/api.types';
import { FormInput } from '@/common/components/form/FormInput';
import { Button } from '@/common/components/ui/Button';
import { AddressMapPicker } from './AddressMapPicker';

interface Props {
  address?: Address;
  onSubmit: (data: AddressFormData) => void;
  onClose: () => void;
  isPending: boolean;
  error: Error | null;
}

export function AddressForm({ address, onSubmit, onClose, isPending, error }: Props) {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<AddressFormData>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      full_name: address?.full_name ?? '',
      phone: address?.phone ?? '',
      address_line: address?.address_line ?? '',
      city: address?.city ?? '',
      latitude: address?.latitude ?? undefined,
      longitude: address?.longitude ?? undefined,
    },
  });

  useEffect(() => {
    if (address) {
      reset({
        full_name: address.full_name,
        phone: address.phone,
        address_line: address.address_line,
        city: address.city,
        latitude: address.latitude ?? undefined,
        longitude: address.longitude ?? undefined,
      });
    }
  }, [address, reset]);

  const addressLine = watch('address_line');
  const city = watch('city');
  const lat = watch('latitude');
  const lng = watch('longitude');
  const addressText = [addressLine, city].filter(Boolean).join(', ');

  return (
    <div className="flex flex-col h-full justify-between">
      <div className="space-y-4">
        {error && (
          <div className="rounded-xl border border-rose-100 bg-rose-50/50 p-4 text-sm text-rose-800">
            {error instanceof ApiError ? error.message : 'An unexpected error occurred'}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" id="address-form">
          <FormInput
            label="Recipient Name"
            type="text"
            registration={register('full_name')}
            error={errors.full_name?.message}
            placeholder="e.g. John Doe"
          />

          <FormInput
            label="Phone Number"
            type="tel"
            registration={register('phone')}
            error={errors.phone?.message}
            placeholder="e.g. 0901234567"
          />

          <FormInput
            label="Address details"
            type="text"
            registration={register('address_line')}
            error={errors.address_line?.message}
            placeholder="Street name, building/apartment number"
          />

          <FormInput
            label="City"
            type="text"
            registration={register('city')}
            error={errors.city?.message}
            placeholder="e.g. Ho Chi Minh City"
          />

          <AddressMapPicker
            latitude={lat ?? null}
            longitude={lng ?? null}
            addressText={addressText}
            onChange={(newLat, newLng) => {
              setValue('latitude', newLat, { shouldDirty: true });
              setValue('longitude', newLng, { shouldDirty: true });
            }}
          />
        </form>
      </div>

      <div className="mt-8 border-t border-border-default pt-4 flex items-center justify-end gap-3 bg-white">
        <Button
          type="button"
          variant="secondary"
          onClick={onClose}
          disabled={isPending}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          form="address-form"
          variant="brand"
          disabled={isPending}
          loading={isPending}
          className="min-w-24"
        >
          {address ? 'Update' : 'Add Address'}
        </Button>
      </div>
    </div>
  );
}
