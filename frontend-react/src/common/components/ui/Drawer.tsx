import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

type DrawerSide = 'left' | 'right';
type DrawerVariant = 'drawer' | 'modal';

type DrawerProps = {
  open: boolean;
  onClose: () => void;
  side?: DrawerSide;
  variant?: DrawerVariant;
  title: string;
  children: ReactNode;
  className?: string;
};

const slideVariants = {
  left: {
    hidden: { x: '-100%' },
    visible: { x: 0 },
    exit: { x: '-100%' },
  },
  right: {
    hidden: { x: '100%' },
    visible: { x: 0 },
    exit: { x: '100%' },
  },
} as const;

const modalVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
} as const;

let lockCount = 0;

function lockScroll() {
  lockCount++;
  if (lockCount === 1) {
    document.body.style.overflow = 'hidden';
  }
}

function unlockScroll() {
  lockCount--;
  if (lockCount <= 0) {
    lockCount = 0;
    document.body.style.overflow = '';
  }
}

export function Drawer({
  open,
  onClose,
  side = 'right',
  variant = 'drawer',
  title,
  children,
  className = '',
}: DrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;

    previousFocusRef.current = document.activeElement as HTMLElement;
    lockScroll();

    const rootEl = document.getElementById('root');
    if (rootEl) rootEl.setAttribute('inert', '');

    const timer = requestAnimationFrame(() => {
      drawerRef.current?.focus();
    });

    return () => {
      cancelAnimationFrame(timer);
      unlockScroll();
      if (rootEl) rootEl.removeAttribute('inert');
      previousFocusRef.current?.focus();
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose();
        return;
      }

      if (e.key === 'Tab' && drawerRef.current) {
        const focusable = drawerRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), textarea, input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
        );
        if (focusable.length === 0) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  const isModal = variant === 'modal';
  const variants = isModal ? modalVariants : slideVariants[side];
  const transition = isModal
    ? { duration: 0.2, ease: 'easeOut' }
    : { type: 'spring' as const, damping: 30, stiffness: 300 };

  const panelClassName = isModal
    ? `relative flex w-full max-w-md max-h-[90vh] flex-col rounded-xl bg-surface shadow-xl outline-none ${className}`
    : `absolute top-0 ${side === 'left' ? 'left-0' : 'right-0'} flex h-full w-full max-w-sm flex-col bg-surface shadow-xl outline-none ${className}`;

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className={`fixed inset-0 z-60 ${isModal ? 'flex items-center justify-center p-4' : ''}`}>
          <motion.div
            className={`${isModal ? 'fixed' : 'absolute'} inset-0 bg-black/50`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />
          <motion.div
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            tabIndex={-1}
            className={panelClassName}
            initial={variants.hidden}
            animate={variants.visible}
            exit={variants.exit}
            transition={transition}
          >
            <div className="flex items-center justify-between border-b border-border-default px-4 py-3">
              <h2 className="text-lg font-semibold text-text-primary">{title}</h2>
              <button
                onClick={onClose}
                className="rounded-lg p-1.5 text-text-secondary hover:bg-surface-hover transition-colors"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
