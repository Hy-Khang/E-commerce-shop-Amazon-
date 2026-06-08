import { Toaster } from 'sonner';

export function ToastProvider() {
  return (
    <Toaster
      position="bottom-right"
      richColors
      closeButton
      duration={3000}
      toastOptions={{
        classNames: {
          toast: 'font-sans border border-border-default bg-elevated text-text-primary shadow-lg rounded-xl px-4 py-3 gap-3',
          title: 'text-sm font-medium text-text-primary',
          description: 'text-xs text-text-secondary',
          actionButton: 'bg-brand hover:bg-brand-hover text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors',
          cancelButton: 'bg-surface hover:bg-surface-hover border border-border-default text-text-secondary text-xs font-medium px-3 py-1.5 rounded-lg transition-colors',
          success: '!border-emerald-100 !bg-emerald-50/80 !text-emerald-800',
          error: '!border-rose-100 !bg-rose-50/80 !text-rose-800',
          info: '!border-sky-100 !bg-sky-50/80 !text-sky-800',
          warning: '!border-amber-100 !bg-amber-50/80 !text-amber-800',
        },
      }}
    />
  );
}

