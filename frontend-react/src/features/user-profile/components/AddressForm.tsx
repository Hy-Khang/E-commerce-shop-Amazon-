import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { X } from 'lucide-react';
import { addressSchema, type AddressFormData, type Address } from '../types/user-profile.types';
import { ApiError } from '@/core/api/api.types';

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
    formState: { errors },
  } = useForm<AddressFormData>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      full_name: address?.full_name ?? '',
      phone: address?.phone ?? '',
      address_line: address?.address_line ?? '',
      city: address?.city ?? '',
    },
  });

  useEffect(() => {
    if (address) {
      reset({
        full_name: address.full_name,
        phone: address.phone,
        address_line: address.address_line,
        city: address.city,
      });
    }
  }, [address, reset]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            {address ? 'Edit Address' : 'Add New Address'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-600">
            {error instanceof ApiError ? error.message : 'An unexpected error occurred'}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label htmlFor="addr_full_name" className="block text-sm font-medium text-gray-700">
              Recipient Name
            </label>
            <input
              id="addr_full_name"
              type="text"
              {...register('full_name')}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            {errors.full_name && (
              <p className="mt-1 text-sm text-red-600">{errors.full_name.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="addr_phone" className="block text-sm font-medium text-gray-700">
              Phone
            </label>
            <input
              id="addr_phone"
              type="tel"
              {...register('phone')}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="e.g. 0901234567"
            />
            {errors.phone && (
              <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="addr_address_line" className="block text-sm font-medium text-gray-700">
              Address
            </label>
            <input
              id="addr_address_line"
              type="text"
              {...register('address_line')}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Street number, street name"
            />
            {errors.address_line && (
              <p className="mt-1 text-sm text-red-600">{errors.address_line.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="addr_city" className="block text-sm font-medium text-gray-700">
              City
            </label>
            <input
              id="addr_city"
              type="text"
              {...register('city')}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="e.g. Ho Chi Minh"
            />
            {errors.city && (
              <p className="mt-1 text-sm text-red-600">{errors.city.message}</p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {isPending ? 'Saving...' : address ? 'Update' : 'Add Address'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
