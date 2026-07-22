import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { forgotPasswordSchema, type ForgotPasswordRequest } from '../types/auth.types';
import { useForgotPassword } from '../hooks/useForgotPassword';
import { ApiError } from '@/core/api/api.types';
import { ROUTES } from '@/common/constants/routes';
import { Button } from '@/common/components/ui/Button';

export default function ForgotPasswordPage() {
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordRequest>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const { mutate, isPending, error } = useForgotPassword();

  if (submitted) {
    return (
      <div>
        <h1 className="mb-2 text-center text-2xl font-bold text-text-primary">Check your email</h1>
        <p className="mb-6 text-center text-sm text-text-secondary">
          If the email exists, we sent a password reset link. Check your inbox and spam folder.
        </p>
        <Link
          to={ROUTES.LOGIN}
          className="block w-full rounded-md bg-brand px-4 py-2.5 text-center text-sm font-medium text-white hover:bg-brand-hover"
        >
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-2 text-center text-2xl font-bold text-text-primary">Forgot your password?</h1>
      <p className="mb-6 text-center text-sm text-text-secondary">
        Enter your email and we&apos;ll send you a reset link.
      </p>

      {error && (
        <div className="mb-4 rounded-md bg-rose-50 p-3 text-sm text-rose-600">
          {error instanceof ApiError ? error.message : 'An unexpected error occurred'}
        </div>
      )}

      <form
        onSubmit={handleSubmit((data) => mutate(data, { onSuccess: () => setSubmitted(true) }))}
        className="space-y-4"
      >
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-text-secondary">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            autoFocus
            {...register('email')}
            className="mt-1 block shop-input"
            placeholder="you@example.com"
          />
          {errors.email && <p className="mt-1 text-sm text-rose-600">{errors.email.message}</p>}
        </div>

        <Button type="submit" variant="brand" loading={isPending} className="w-full">
          {isPending ? 'Sending...' : 'Send reset link'}
        </Button>
      </form>

      <p className="mt-4 text-center text-sm text-text-secondary">
        Remember your password?{' '}
        <Link to={ROUTES.LOGIN} className="font-medium text-text-brand hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
