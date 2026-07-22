import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  changePasswordSchema,
  setPasswordSchema,
  type ChangePasswordFormData,
  type SetPasswordFormData,
} from '../types/auth.types';
import { useChangePassword } from '../hooks/useChangePassword';
import { useSetPassword } from '../hooks/useSetPassword';
import { useAuthStore } from '../stores/auth.store';
import { ApiError } from '@/core/api/api.types';
import { Button } from '@/common/components/ui/Button';

export function ChangePasswordForm() {
  const user = useAuthStore((s) => s.user);
  const hasPassword = user?.has_password ?? true;

  if (hasPassword) {
    return <ChangePasswordMode />;
  }
  return <SetPasswordMode />;
}

function ChangePasswordMode() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
  });

  const { mutate, isPending, error, isSuccess } = useChangePassword();

  return (
    <form
      onSubmit={handleSubmit((data) =>
        mutate({ current_password: data.current_password, new_password: data.new_password }),
      )}
      className="space-y-4"
    >
      {error && (
        <div className="rounded-md bg-rose-50 p-3 text-sm text-rose-600">
          {error instanceof ApiError ? error.message : 'An unexpected error occurred'}
        </div>
      )}

      {isSuccess && (
        <div className="rounded-md bg-emerald-50 p-3 text-sm text-emerald-700">
          Password changed successfully. You will be logged out.
        </div>
      )}

      <div>
        <label htmlFor="current_password" className="block text-sm font-medium text-text-secondary">
          Current password
        </label>
        <input
          id="current_password"
          type="password"
          autoComplete="current-password"
          {...register('current_password')}
          className="mt-1 block shop-input"
        />
        {errors.current_password && (
          <p className="mt-1 text-sm text-rose-600">{errors.current_password.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="new_password" className="block text-sm font-medium text-text-secondary">
          New password
        </label>
        <input
          id="new_password"
          type="password"
          autoComplete="new-password"
          {...register('new_password')}
          className="mt-1 block shop-input"
        />
        {errors.new_password && (
          <p className="mt-1 text-sm text-rose-600">{errors.new_password.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-text-secondary">
          Confirm new password
        </label>
        <input
          id="confirmPassword"
          type="password"
          autoComplete="new-password"
          {...register('confirmPassword')}
          className="mt-1 block shop-input"
        />
        {errors.confirmPassword && (
          <p className="mt-1 text-sm text-rose-600">{errors.confirmPassword.message}</p>
        )}
      </div>

      <Button type="submit" variant="brand" loading={isPending}>
        {isPending ? 'Changing...' : 'Change password'}
      </Button>
    </form>
  );
}

function SetPasswordMode() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SetPasswordFormData>({
    resolver: zodResolver(setPasswordSchema),
  });

  const { mutate, isPending, error, isSuccess } = useSetPassword();

  return (
    <form
      onSubmit={handleSubmit((data) => mutate({ new_password: data.new_password }))}
      className="space-y-4"
    >
      <div className="rounded-md bg-sky-50 p-3 text-sm text-sky-700">
        You signed in with a social account and don&apos;t have a password yet. Set one to also sign
        in with email and password.
      </div>

      {error && (
        <div className="rounded-md bg-rose-50 p-3 text-sm text-rose-600">
          {error instanceof ApiError ? error.message : 'An unexpected error occurred'}
        </div>
      )}

      {isSuccess && (
        <div className="rounded-md bg-emerald-50 p-3 text-sm text-emerald-700">
          Password set successfully. You will be logged out.
        </div>
      )}

      <div>
        <label htmlFor="new_password" className="block text-sm font-medium text-text-secondary">
          Password
        </label>
        <input
          id="new_password"
          type="password"
          autoComplete="new-password"
          {...register('new_password')}
          className="mt-1 block shop-input"
        />
        {errors.new_password && (
          <p className="mt-1 text-sm text-rose-600">{errors.new_password.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-text-secondary">
          Confirm password
        </label>
        <input
          id="confirmPassword"
          type="password"
          autoComplete="new-password"
          {...register('confirmPassword')}
          className="mt-1 block shop-input"
        />
        {errors.confirmPassword && (
          <p className="mt-1 text-sm text-rose-600">{errors.confirmPassword.message}</p>
        )}
      </div>

      <Button type="submit" variant="brand" loading={isPending}>
        {isPending ? 'Setting...' : 'Set password'}
      </Button>
    </form>
  );
}
