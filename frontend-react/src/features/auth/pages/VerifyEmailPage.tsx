import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Navigate, Link } from 'react-router-dom';
import { useVerifyEmail } from '../hooks/useVerifyEmail';
import { useResendVerification } from '../hooks/useResendVerification';
import { ApiError } from '@/core/api/api.types';
import { ROUTES } from '@/common/constants/routes';
import { Button } from '@/common/components/ui/Button';

const OTP_LENGTH = 6;
const COOLDOWN_SECONDS = 60;

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email');

  const [otp, setOtp] = useState('');
  const [cooldown, setCooldown] = useState(COOLDOWN_SECONDS);

  const { mutate: verify, isPending: isVerifying, error: verifyError } = useVerifyEmail();
  const { mutate: resend, isPending: isResending, error: resendError } = useResendVerification();

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleOtpChange = useCallback((value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, OTP_LENGTH);
    setOtp(digits);
  }, []);

  if (!email) {
    return <Navigate to={ROUTES.REGISTER} replace />;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== OTP_LENGTH) return;
    verify({ email, otp });
  };

  const handleResend = () => {
    resend(email, {
      onSuccess: () => setCooldown(COOLDOWN_SECONDS),
    });
  };

  const error = verifyError || resendError;
  const errorMessage = error instanceof ApiError ? error.message : error ? 'An unexpected error occurred' : null;

  return (
    <div>
      <h1 className="mb-2 text-center text-2xl font-bold text-text-primary">Verify your email</h1>
      <p className="mb-6 text-center text-sm text-text-secondary">
        We sent a 6-digit code to <span className="font-medium text-text-primary">{email}</span>
      </p>

      {errorMessage && (
        <div className="mb-4 rounded-md bg-rose-50 p-3 text-sm text-rose-600">
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="otp" className="block text-sm font-medium text-text-secondary">
            Verification code
          </label>
          <input
            id="otp"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            autoFocus
            value={otp}
            onChange={(e) => handleOtpChange(e.target.value)}
            className="mt-1 block shop-input text-center text-2xl tracking-[0.5em]"
            placeholder="000000"
            maxLength={OTP_LENGTH}
          />
        </div>

        <Button
          type="submit"
          variant="brand"
          loading={isVerifying}
          disabled={otp.length !== OTP_LENGTH}
          className="w-full"
        >
          {isVerifying ? 'Verifying...' : 'Verify email'}
        </Button>
      </form>

      <div className="mt-4 text-center text-sm text-text-secondary">
        Didn&apos;t receive the code?{' '}
        {cooldown > 0 ? (
          <span className="text-text-muted">Resend in {cooldown}s</span>
        ) : (
          <button
            type="button"
            onClick={handleResend}
            disabled={isResending}
            className="font-medium text-text-brand hover:underline disabled:opacity-50"
          >
            {isResending ? 'Sending...' : 'Resend code'}
          </button>
        )}
      </div>

      <p className="mt-4 text-center text-sm text-text-secondary">
        Wrong email?{' '}
        <Link to={ROUTES.REGISTER} className="font-medium text-text-brand hover:underline">
          Go back
        </Link>
      </p>
    </div>
  );
}
