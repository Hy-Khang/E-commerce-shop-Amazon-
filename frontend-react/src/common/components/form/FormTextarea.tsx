import type { TextareaHTMLAttributes } from 'react';
import type { UseFormRegisterReturn } from 'react-hook-form';

type FormTextareaProps = {
  label: string;
  error?: string;
  registration: UseFormRegisterReturn;
} & Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'name'>;

export function FormTextarea({
  label,
  error,
  registration,
  id,
  className = '',
  ...props
}: FormTextareaProps) {
  const textareaId = id || registration.name;

  return (
    <div>
      <label htmlFor={textareaId} className="block text-sm font-medium text-text-primary">
        {label}
      </label>
      <textarea
        id={textareaId}
        {...registration}
        aria-invalid={!!error}
        aria-describedby={error ? `${textareaId}-error` : undefined}
        className={`mt-1 shop-input ${error ? 'border-error-500 focus:border-error-500 focus:ring-error-500/20' : ''} ${className}`}
        {...props}
      />
      {error && (
        <p id={`${textareaId}-error`} className="mt-1 text-sm text-error-500" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
