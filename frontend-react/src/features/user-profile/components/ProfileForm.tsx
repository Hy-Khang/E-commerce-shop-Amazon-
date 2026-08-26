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
import { FormInput } from '@/common/components/form/FormInput';
import { Button } from '@/common/components/ui/Button';

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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 max-w-md">
      {error && (
        <div className="rounded-xl border border-rose-100 bg-rose-50/50 p-4 text-sm text-rose-800">
          {error instanceof ApiError ? error.message : 'An unexpected error occurred'}
        </div>
      )}

      {isSuccess && !isDirty && (
        <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-4 text-sm text-emerald-800 animate-fade-in">
          Profile updated successfully
        </div>
      )}

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-text-primary mb-1">
          Email Address
        </label>
        <input
          id="email"
          type="email"
          value={profile.email}
          disabled
          className="shop-input bg-surface-hover text-text-secondary cursor-not-allowed border-border-default"
        />
      </div>

      <FormInput
        label="Full Name"
        type="text"
        registration={register('full_name')}
        error={errors.full_name?.message}
      />

      <FormInput
        label="Phone Number"
        type="tel"
        registration={register('phone')}
        error={errors.phone?.message}
        placeholder="e.g. 0901234567"
      />

      <div className="pt-2">
        <Button
          type="submit"
          variant="brand"
          disabled={!isDirty || isPending}
          loading={isPending}
          className="px-6"
        >
          Save Changes
        </Button>
      </div>
    </form>
  );
}

