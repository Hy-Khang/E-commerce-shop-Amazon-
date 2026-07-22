import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSearchParams, Navigate, Link } from 'react-router-dom';
import { resetPasswordSchema, type ResetPasswordRequest } from '../types/auth.types';
import { useResetPassword } from '../hooks/useResetPassword';
import { ApiError } from '@/core/api/api.types';
import { ROUTES } from '@/common/constants/routes';
import { Button } from '@/common/components/ui/Button';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordRequest>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { token: token || '' },
  });

  const { mutate, isPending, error } = useResetPassword();

  if (!token) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  return (
    <div>
      <h1 className="mb-2 text-center text-2xl font-bold text-text-primary">Set new password</h1>
      <p className="mb-6 text-center text-sm text-text-secondary">
        Enter your new password below.
      </p>

      {error && (
        <div className="mb-4 rounded-md bg-rose-50 p-3 text-sm text-rose-600">
          {error instanceof ApiError ? error.message : 'An unexpected error occurred'}
        </div>
      )}

      <form
        onSubmit={handleSubmit((data) => mutate({ token: data.token, password: data.password }))}
        className="space-y-4"
      >
        <input type="hidden" {...register('token')} />

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-text-secondary">
            New password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            autoFocus
            {...register('password')}
            className="mt-1 block shop-input"
            placeholder="••••••••"
          />
          {errors.password && <p className="mt-1 text-sm text-rose-600">{errors.password.message}</p>}
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
            placeholder="••••••••"
          />
          {errors.confirmPassword && (
            <p className="mt-1 text-sm text-rose-600">{errors.confirmPassword.message}</p>
          )}
        </div>

        <Button type="submit" variant="brand" loading={isPending} className="w-full">
          {isPending ? 'Resetting...' : 'Reset password'}
        </Button>
      </form>

      <p className="mt-4 text-center text-sm text-text-secondary">
        <Link to={ROUTES.LOGIN} className="font-medium text-text-brand hover:underline">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
