import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, Info, Trash2, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
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
  confirmVariant?: 'primary' | 'brand' | 'danger' | 'secondary';
  loading?: boolean;
}

const VARIANT_CONFIG: Record<ConfirmVariant, {
  icon: typeof AlertTriangle;
  iconBg: string;
  iconColor: string;
  buttonVariant: 'danger' | 'primary' | 'brand';
}> = {
  danger: {
    icon: Trash2,
    iconBg: 'bg-rose-50 border border-rose-100',
    iconColor: 'text-rose-600',
    buttonVariant: 'danger',
  },
  warning: {
    icon: AlertTriangle,
    iconBg: 'bg-amber-50 border border-amber-100',
    iconColor: 'text-amber-600',
    buttonVariant: 'danger',
  },
  info: {
    icon: Info,
    iconBg: 'bg-teal-50 border border-teal-100',
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
  confirmVariant,
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

  // Use the explicitly provided confirmVariant if available, otherwise fallback to config default
  const activeConfirmVariant = confirmVariant || config.buttonVariant;

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-70 flex items-center justify-center p-4">
          <motion.div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={loading ? undefined : onCancel}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-slate-100 ring-1 ring-black/5 overflow-hidden"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          >
            <button
              onClick={onCancel}
              disabled={loading}
              className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-50 hover:text-slate-600 disabled:opacity-50 transition-colors"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex gap-4">
              <div className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full ${config.iconBg}`}>
                <Icon className={`h-5.5 w-5.5 ${config.iconColor}`} />
              </div>
              <div className="min-w-0 flex-1 pt-1">
                <h3 className="text-lg font-semibold text-slate-900 leading-6">{title}</h3>
                <p className="mt-2 text-sm text-slate-500 leading-relaxed">{message}</p>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <Button
                ref={cancelRef}
                variant="secondary"
                onClick={onCancel}
                disabled={loading}
              >
                {cancelLabel}
              </Button>
              <Button
                variant={activeConfirmVariant}
                onClick={onConfirm}
                loading={loading}
              >
                {confirmLabel}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

