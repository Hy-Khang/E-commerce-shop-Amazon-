import { type ButtonHTMLAttributes, type ReactNode, type Ref } from 'react';
import { Loader2 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const variants = {
  primary: 'bg-teal-600 hover:bg-teal-700 text-white shadow-sm',
  brand: 'bg-brand hover:bg-brand-hover text-white shadow-sm',
  'brand-outline': 'border border-border-brand text-text-brand hover:bg-brand-light shadow-sm',
  secondary:
    'border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-sm dark:border-border-default dark:bg-surface dark:hover:bg-surface-hover dark:text-text-primary',
  danger: 'bg-rose-600 hover:bg-rose-700 text-white shadow-sm',
  ghost:
    'text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-text-secondary dark:hover:bg-surface-hover dark:hover:text-text-primary',
} as const;

const sizes = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
} as const;

type ButtonProps = {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  loading?: boolean;
  icon?: LucideIcon;
  iconOnly?: boolean;
  children?: ReactNode;
  ref?: Ref<HTMLButtonElement>;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'>;

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon: Icon,
  iconOnly = false,
  children,
  className = '',
  disabled,
  ref,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const isBrand = variant === 'brand' || variant === 'brand-outline';
  const ringClass = isBrand
    ? 'focus-visible:ring-2 focus-visible:ring-ring-focus focus-visible:ring-offset-2'
    : 'focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2';

  if (iconOnly && Icon) {
    return (
      <button
        ref={ref}
        className={`inline-flex items-center justify-center rounded-lg p-2 transition-colors ${ringClass} disabled:opacity-50 disabled:pointer-events-none ${variants[variant]} ${className}`}
        disabled={isDisabled}
        {...props}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Icon className="h-4 w-4" />
        )}
      </button>
    );
  }

  return (
    <button
      ref={ref}
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors ${ringClass} disabled:opacity-50 disabled:pointer-events-none ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={isDisabled}
      {...props}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : Icon ? (
        <Icon className="h-4 w-4" />
      ) : null}
      {children}
    </button>
  );
}
