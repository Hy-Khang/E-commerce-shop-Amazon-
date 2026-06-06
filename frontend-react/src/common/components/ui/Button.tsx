import { type ButtonHTMLAttributes, type ReactNode, type Ref } from 'react';
import { Loader2 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const variants = {
  primary: 'bg-teal-600 hover:bg-teal-700 text-white shadow-sm',
  secondary: 'border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-sm',
  danger: 'bg-rose-600 hover:bg-rose-700 text-white shadow-sm',
  ghost: 'text-slate-500 hover:bg-slate-100 hover:text-slate-700',
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

  if (iconOnly && Icon) {
    return (
      <button
        ref={ref}
        className={`inline-flex items-center justify-center rounded-lg p-2 transition-colors focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ${variants[variant]} ${className}`}
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
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ${variants[variant]} ${sizes[size]} ${className}`}
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
