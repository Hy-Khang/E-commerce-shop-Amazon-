import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, Info, Trash2, X } from 'lucide-react';
import { Button } from './Button';

type ConfirmVariant = 'danger' | 'warning' | 'info';

interface ConfirmModalProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmVariant;
  loading?: boolean;
}

const VARIANT_CONFIG: Record<ConfirmVariant, {
  icon: typeof AlertTriangle;
  iconBg: string;
  iconColor: string;
  buttonVariant: 'danger' | 'primary';
}> = {
  danger: {
    icon: Trash2,
    iconBg: 'bg-rose-100',
    iconColor: 'text-rose-600',
    buttonVariant: 'danger',
  },
  warning: {
    icon: AlertTriangle,
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
    buttonVariant: 'danger',
  },
  info: {
    icon: Info,
    iconBg: 'bg-teal-100',
    iconColor: 'text-teal-600',
    buttonVariant: 'primary',
  },
};

export function ConfirmModal({
  open,
  onConfirm,
  onCancel,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'warning',
  loading = false,
}: ConfirmModalProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  const config = VARIANT_CONFIG[variant];
  const Icon = config.icon;

  useEffect(() => {
    if (open) {
      cancelRef.current?.focus();
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && !loading) onCancel();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, loading, onCancel]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-black/50 transition-opacity"
        onClick={loading ? undefined : onCancel}
      />
      <div className="admin-card relative w-full max-w-md">
        <button
          onClick={onCancel}
          disabled={loading}
          className="absolute right-3 top-3 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50 transition-colors"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="p-6">
          <div className="flex gap-4">
            <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${config.iconBg}`}>
              <Icon className={`h-5 w-5 ${config.iconColor}`} />
            </div>
            <div className="min-w-0">
              <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
              <p className="mt-2 text-sm text-slate-600">{message}</p>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4 rounded-b-xl">
          <Button
            ref={cancelRef}
            variant="secondary"
            onClick={onCancel}
            disabled={loading}
          >
            {cancelLabel}
          </Button>
          <Button
            variant={config.buttonVariant}
            onClick={onConfirm}
            loading={loading}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
