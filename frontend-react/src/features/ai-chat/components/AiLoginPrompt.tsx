import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { LogIn, Loader2, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { loginSchema, useLogin, SocialLoginButtons, type LoginRequest } from '@/features/auth';
import { ApiError } from '@/core/api/api.types';
import { ROUTES } from '@/common/constants/routes';

interface Props {
  /** Fired after a successful sign-in (cart already merged) — the panel resumes
   *  the interrupted action (e.g. re-sends the checkout intent). */
  onSuccess: () => void;
  onClose: () => void;
}

/**
 * Compact login popup rendered *inside* the chat widget. Signing in here keeps
 * the conversation open (no navigation away): the guest cart is merged and the
 * caller resumes whatever the agent was blocked on, so the shopper doesn't have
 * to repeat "I want to check out".
 */
export function AiLoginPrompt({ onSuccess, onClose }: Props) {
  const { t } = useTranslation('aiChat');
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginRequest>({ resolver: zodResolver(loginSchema) });

  // Stay on the page; confirm success, then resume the interrupted flow.
  const { mutate, isPending, error } = useLogin({
    redirect: false,
    onSuccess: () => {
      toast.success(t('widget.loginSuccess'));
      onSuccess();
    },
  });

  return (
    <div className="absolute inset-0 z-10 flex flex-col bg-surface/95 backdrop-blur-sm">
      <div className="flex items-center justify-between border-b border-border-default px-4 py-3">
        <p className="flex items-center gap-1.5 text-sm font-bold text-text-primary">
          <LogIn className="h-4 w-4 text-text-brand" /> {t('loginPrompt.title')}
        </p>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1.5 text-text-secondary transition-colors hover:bg-surface-hover"
          aria-label={t('loginPrompt.close')}
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        <p className="mb-3 text-xs text-text-secondary">
          {t('loginPrompt.description')}
        </p>

        <form onSubmit={handleSubmit((data) => mutate(data))} className="space-y-3">
          {error && (
            <div className="rounded-md bg-rose-50 p-2.5 text-xs text-rose-600">
              {error instanceof ApiError ? error.message : t('loginPrompt.error')}
            </div>
          )}

          <div>
            <label htmlFor="ai-login-email" className="block text-xs font-medium text-text-secondary">
              {t('loginPrompt.email')}
            </label>
            <input
              id="ai-login-email"
              type="email"
              autoComplete="email"
              {...register('email')}
              className="mt-1 block shop-input"
              placeholder={t('loginPrompt.emailPlaceholder')}
            />
            {errors.email && (
              <p className="mt-1 text-xs text-rose-600">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="ai-login-password" className="block text-xs font-medium text-text-secondary">
              {t('loginPrompt.password')}
            </label>
            <input
              id="ai-login-password"
              type="password"
              autoComplete="current-password"
              {...register('password')}
              className="mt-1 block shop-input"
              placeholder={t('loginPrompt.passwordPlaceholder')}
            />
            {errors.password && (
              <p className="mt-1 text-xs text-rose-600">{errors.password.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-brand px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-hover disabled:opacity-50 disabled:pointer-events-none"
          >
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {isPending ? t('loginPrompt.signingIn') : t('loginPrompt.signIn')}
          </button>
        </form>

        <div className="my-4 flex items-center gap-3">
          <span className="h-px flex-1 bg-border-default" />
          <span className="text-xs text-text-muted">{t('loginPrompt.or')}</span>
          <span className="h-px flex-1 bg-border-default" />
        </div>

        <SocialLoginButtons />

        <p className="mt-3 text-center text-xs text-text-secondary">
          {t('loginPrompt.noAccount')}{' '}
          <Link
            to={ROUTES.REGISTER}
            onClick={onClose}
            className="font-medium text-text-brand hover:underline"
          >
            {t('loginPrompt.register')}
          </Link>
        </p>
      </div>
    </div>
  );
}
