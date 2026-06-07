import type { InputHTMLAttributes } from 'react';
import type { UseFormRegisterReturn } from 'react-hook-form';

type FormInputProps = {
  label: string;
  error?: string;
  registration: UseFormRegisterReturn;
} & Omit<InputHTMLAttributes<HTMLInputElement>, 'name'>;

export function FormInput({
  label,
  error,
  registration,
  id,
  className = '',
  ...props
}: FormInputProps) {
  const inputId = id || registration.name;

  return (
    <div>
      <label htmlFor={inputId} className="block text-sm font-medium text-text-primary">
        {label}
      </label>
      <input
        id={inputId}
        {...registration}
        aria-invalid={!!error}
        aria-describedby={error ? `${inputId}-error` : undefined}
        className={`mt-1 shop-input ${error ? 'border-error-500 focus:border-error-500 focus:ring-error-500/20' : ''} ${className}`}
        {...props}
      />
      {error && (
        <p id={`${inputId}-error`} className="mt-1 text-sm text-error-500" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
