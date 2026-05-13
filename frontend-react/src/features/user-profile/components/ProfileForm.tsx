import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import {
  updateProfileSchema,
  type UpdateProfileFormData,
  type UserProfile,
} from '../types/user-profile.types';
import { useUpdateProfile } from '../hooks/useUpdateProfile';
import { ApiError } from '@/core/api/api.types';

interface Props {
  profile: UserProfile;
}

export function ProfileForm({ profile }: Props) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<UpdateProfileFormData>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      full_name: profile.full_name,
      phone: profile.phone ?? '',
    },
  });

  useEffect(() => {
    reset({
      full_name: profile.full_name,
      phone: profile.phone ?? '',
    });
  }, [profile, reset]);

  const { mutate, isPending, isSuccess, error } = useUpdateProfile();

  function onSubmit(data: UpdateProfileFormData) {
    mutate({
      full_name: data.full_name,
      phone: data.phone || undefined,
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
          {error instanceof ApiError ? error.message : 'An unexpected error occurred'}
        </div>
      )}

      {isSuccess && !isDirty && (
        <div className="rounded-md bg-green-50 p-3 text-sm text-green-600">
          Profile updated successfully
        </div>
      )}

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={profile.email}
          disabled
          className="mt-1 block w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-gray-500"
        />
      </div>

      <div>
        <label htmlFor="full_name" className="block text-sm font-medium text-gray-700">
          Full Name
        </label>
        <input
          id="full_name"
          type="text"
          {...register('full_name')}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        {errors.full_name && (
          <p className="mt-1 text-sm text-red-600">{errors.full_name.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
          Phone
        </label>
        <input
          id="phone"
          type="tel"
          {...register('phone')}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="e.g. 0901234567"
        />
        {errors.phone && (
          <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={isPending || !isDirty}
        className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
      >
        {isPending ? 'Saving...' : 'Save Changes'}
      </button>
    </form>
  );
}
