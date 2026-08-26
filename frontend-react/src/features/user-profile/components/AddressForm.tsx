import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { addressSchema, type AddressFormData, type Address, type LocationValue } from '../types/user-profile.types';
import { ApiError } from '@/core/api/api.types';
import { FormInput } from '@/common/components/form/FormInput';
import { Button } from '@/common/components/ui/Button';
import { LocationPicker } from './LocationPicker';
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
    control,
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

  const [location, setLocation] = useState<LocationValue>({
    province: null,
    district: null,
    ward: null,
  });
  const [flyTarget, setFlyTarget] = useState<[number, number] | null>(null);

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

  // Clear the cascading location picker when a different address is edited.
  // Adjust state during render (React docs: "storing info from previous renders").
  const [prevAddressId, setPrevAddressId] = useState(address?.id);
  if (address?.id !== prevAddressId) {
    setPrevAddressId(address?.id);
    setLocation({ province: null, district: null, ward: null });
  }

  const addressLine = useWatch({ control, name: 'address_line' });
  const city = useWatch({ control, name: 'city' });
  const lat = useWatch({ control, name: 'latitude' });
  const lng = useWatch({ control, name: 'longitude' });
  const addressText = [addressLine, city].filter(Boolean).join(', ');

  async function autoGeocode(query: string) {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`,
      );
      const data = await res.json();
      if (data.length > 0) {
        const newLat = parseFloat(data[0].lat);
        const newLng = parseFloat(data[0].lon);
        setValue('latitude', newLat, { shouldDirty: true });
        setValue('longitude', newLng, { shouldDirty: true });
        setFlyTarget([newLat, newLng]);
      }
    } catch {
      // Silent fail — user can still use "Find on map" or click the map
    }
  }

  function handleLocationChange(newLocation: LocationValue) {
    setLocation(newLocation);
    if (newLocation.ward && newLocation.district && newLocation.province) {
      const cityValue = `${newLocation.ward.name}, ${newLocation.district.name}, ${newLocation.province.name}`;
      setValue('city', cityValue, { shouldDirty: true, shouldValidate: true });
      autoGeocode(`${cityValue}, Vietnam`);
    } else if (newLocation.province) {
      const partial = [
        newLocation.district?.name,
        newLocation.province.name,
      ]
        .filter(Boolean)
        .join(', ');
      setValue('city', partial, { shouldDirty: true });
    } else {
      setValue('city', '', { shouldDirty: true });
    }
  }

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

          <LocationPicker
            value={location}
            onChange={handleLocationChange}
            error={errors.city?.message}
            initialDisplayText={address?.city}
          />

          <FormInput
            label="Address Details"
            type="text"
            registration={register('address_line')}
            error={errors.address_line?.message}
            placeholder="House number, street name, building..."
          />

          <AddressMapPicker
            latitude={lat ?? null}
            longitude={lng ?? null}
            addressText={addressText}
            onChange={(newLat, newLng) => {
              setValue('latitude', newLat, { shouldDirty: true });
              setValue('longitude', newLng, { shouldDirty: true });
            }}
            externalFlyTo={flyTarget}
          />
        </form>
      </div>

      <div className="mt-8 border-t border-border-default pt-4 flex items-center justify-end gap-3 bg-surface">
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
