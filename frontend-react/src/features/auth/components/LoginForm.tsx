import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { loginSchema, type LoginRequest } from '../types/auth.types';
import { useLogin } from '../hooks/useLogin';
import { ApiError } from '@/core/api/api.types';
import { ROUTES } from '@/common/constants/routes';
import { Button } from '@/common/components/ui/Button';
import { SocialLoginButtons } from './SocialLoginButtons';

export function LoginForm() {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<LoginRequest>({
    resolver: zodResolver(loginSchema),
  });

  const { mutate, isPending, error } = useLogin();

  const isUnverified = error instanceof ApiError && error.code === 'AUTH_006';

  return (
    <form onSubmit={handleSubmit((data) => mutate(data))} className="space-y-4">
      {error && !isUnverified && (
        <div className="rounded-md bg-rose-50 p-3 text-sm text-rose-600">
          {error instanceof ApiError ? error.message : 'An unexpected error occurred'}
        </div>
      )}

      {isUnverified && (
        <div className="rounded-md bg-amber-50 p-3 text-sm text-amber-700">
          <p className="font-medium">Email not verified</p>
          <p className="mt-1">Please verify your email before signing in.</p>
          <button
            type="button"
            onClick={() => {
              const email = getValues('email');
              navigate(`${ROUTES.VERIFY_EMAIL}?email=${encodeURIComponent(email)}`);
            }}
            className="mt-2 text-sm font-medium text-amber-800 underline hover:no-underline"
          >
            Go to verification page
          </button>
        </div>
      )}

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-text-secondary">
          Email
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          {...register('email')}
          className="mt-1 block shop-input"
          placeholder="you@example.com"
        />
        {errors.email && <p className="mt-1 text-sm text-rose-600">{errors.email.message}</p>}
      </div>

      <div>
        <div className="flex items-center justify-between">
          <label htmlFor="password" className="block text-sm font-medium text-text-secondary">
            Password
          </label>
          <Link
            to={ROUTES.FORGOT_PASSWORD}
            className="text-sm text-text-brand hover:underline"
          >
            Forgot password?
          </Link>
        </div>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          {...register('password')}
          className="mt-1 block shop-input"
          placeholder="••••••••"
        />
        {errors.password && <p className="mt-1 text-sm text-rose-600">{errors.password.message}</p>}
      </div>

      <Button
        type="submit"
        variant="brand"
        loading={isPending}
        className="w-full"
      >
        {isPending ? 'Signing in...' : 'Sign in'}
      </Button>

      <div className="relative my-2">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border-default" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-surface-primary px-2 text-text-secondary">or</span>
        </div>
      </div>

      <SocialLoginButtons />

      <p className="text-center text-sm text-text-secondary">
        Don&apos;t have an account?{' '}
        <Link to={ROUTES.REGISTER} className="font-medium text-text-brand hover:underline">
          Register
        </Link>
      </p>
    </form>
  );
}
