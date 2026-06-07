import type { SelectHTMLAttributes } from 'react';
import type { UseFormRegisterReturn } from 'react-hook-form';

type FormSelectProps = {
  label: string;
  error?: string;
  registration: UseFormRegisterReturn;
  options: { value: string; label: string }[];
  placeholder?: string;
} & Omit<SelectHTMLAttributes<HTMLSelectElement>, 'name'>;

export function FormSelect({
  label,
  error,
  registration,
  options,
  placeholder,
  id,
  className = '',
  ...props
}: FormSelectProps) {
  const selectId = id || registration.name;

  return (
    <div>
      <label htmlFor={selectId} className="block text-sm font-medium text-text-primary">
        {label}
      </label>
      <select
        id={selectId}
        {...registration}
        aria-invalid={!!error}
        aria-describedby={error ? `${selectId}-error` : undefined}
        className={`mt-1 shop-input ${error ? 'border-error-500 focus:border-error-500 focus:ring-error-500/20' : ''} ${className}`}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && (
        <p id={`${selectId}-error`} className="mt-1 text-sm text-error-500" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
