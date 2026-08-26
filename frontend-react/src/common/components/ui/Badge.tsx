import type { ReactNode } from 'react';

const variants = {
  success: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-400/20',
  warning: 'bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/15 dark:text-amber-300 dark:ring-amber-400/20',
  error: 'bg-rose-50 text-rose-700 ring-rose-600/20 dark:bg-rose-500/15 dark:text-rose-300 dark:ring-rose-400/20',
  info: 'bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-500/15 dark:text-blue-300 dark:ring-blue-400/20',
  neutral: 'bg-neutral-100 text-neutral-600 ring-neutral-500/20 dark:bg-neutral-500/15 dark:text-neutral-300 dark:ring-neutral-400/20',
  brand: 'bg-primary-50 text-primary-700 ring-primary-600/20 dark:bg-primary-500/15 dark:text-primary-300 dark:ring-primary-400/20',
} as const;

type BadgeProps = {
  variant?: keyof typeof variants;
  children: ReactNode;
  className?: string;
};

export function Badge({
  variant = 'neutral',
  children,
  className = '',
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
