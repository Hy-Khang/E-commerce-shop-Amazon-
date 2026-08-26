import { useState, useRef, useEffect } from 'react';
import { Sun, Moon, Monitor, type LucideIcon } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useThemeStore, type ThemeMode } from '@/common/theme';

const options: Array<{ mode: ThemeMode; label: string; icon: LucideIcon }> = [
  { mode: 'light', label: 'Light', icon: Sun },
  { mode: 'dark', label: 'Dark', icon: Moon },
  { mode: 'system', label: 'System', icon: Monitor },
];

export function ThemeToggle() {
  const mode = useThemeStore((s) => s.mode);
  const setMode = useThemeStore((s) => s.setMode);
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
    }
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const ActiveIcon = options.find((o) => o.mode === mode)?.icon ?? Monitor;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="rounded-lg p-2 text-text-secondary hover:bg-surface-hover transition-colors"
        aria-label="Change theme"
        aria-haspopup="menu"
        aria-expanded={isOpen}
      >
        {/* Fixed-size box so the swapping icon never shifts the layout. */}
        <span className="relative inline-flex h-5 w-5 items-center justify-center">
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={mode}
              initial={reduceMotion ? { opacity: 0 } : { rotate: -90, scale: 0.4, opacity: 0 }}
              animate={reduceMotion ? { opacity: 1 } : { rotate: 0, scale: 1, opacity: 1 }}
              exit={reduceMotion ? { opacity: 0 } : { rotate: 90, scale: 0.4, opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <ActiveIcon className="h-5 w-5" />
            </motion.span>
          </AnimatePresence>
        </span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: -4, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.96 }}
            transition={{ duration: 0.14, ease: 'easeOut' }}
            className="absolute right-0 z-50 mt-2 w-40 origin-top-right rounded-xl border border-border-default bg-elevated py-1 shadow-lg shadow-neutral-900/5"
          >
            {options.map((option) => {
              const Icon = option.icon;
              const active = option.mode === mode;
              return (
                <button
                  key={option.mode}
                  role="menuitemradio"
                  aria-checked={active}
                  onClick={() => {
                    setMode(option.mode);
                    setIsOpen(false);
                  }}
                  className={`flex w-full items-center gap-3 px-4 py-2 text-sm transition-colors ${
                    active
                      ? 'bg-brand-light font-semibold text-text-brand'
                      : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {option.label}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
