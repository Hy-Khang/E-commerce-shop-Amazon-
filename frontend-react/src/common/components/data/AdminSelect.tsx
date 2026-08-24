import { useEffect, useId, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

export interface AdminSelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface AdminSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: AdminSelectOption[];
  /** Accessible name — use when there is no visible `<label htmlFor>`. */
  ariaLabel?: string;
  /** Associates a visible `<label htmlFor={id}>` with the trigger. */
  id?: string;
  /** Shown (muted) when no option matches the current value. */
  placeholder?: string;
  /** Optional icon rendered inside the trigger, left of the label. */
  leadingIcon?: LucideIcon;
  /** Classes for the root wrapper — carry width/spacing here (e.g. `w-52`, `mt-1`). */
  className?: string;
  disabled?: boolean;
}

function firstEnabledIndex(options: AdminSelectOption[]): number {
  return options.findIndex((o) => !o.disabled);
}

function lastEnabledIndex(options: AdminSelectOption[]): number {
  for (let i = options.length - 1; i >= 0; i--) {
    if (!options[i].disabled) return i;
  }
  return -1;
}

/**
 * Custom admin dropdown that replaces the native `<select>` so the open popup
 * (border, radius, hover, scroll) can be styled to match the admin design
 * language — native `<select>` popups are OS-rendered and unstylable.
 *
 * Keeps the native contract (`value` + `onChange(value)`), so it is a drop-in
 * swap. Keyboard: ↑/↓ move, Enter/Space select, Esc/Tab close, Home/End jump.
 * Closes on outside click. Trigger reuses the `.admin-input` token.
 */
export function AdminSelect({
  value,
  onChange,
  options,
  ariaLabel,
  id,
  placeholder,
  leadingIcon: LeadingIcon,
  className = '',
  disabled = false,
}: AdminSelectProps) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const reactId = useId();
  const listboxId = `${id ?? reactId}-listbox`;

  const selected = options.find((o) => o.value === value);
  const displayLabel = selected?.label ?? placeholder ?? '';

  // Close when clicking outside.
  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open]);

  // Keep the active option scrolled into view.
  useEffect(() => {
    if (!open || activeIndex < 0) return;
    const node = listRef.current?.children[activeIndex] as HTMLElement | undefined;
    node?.scrollIntoView({ block: 'nearest' });
  }, [open, activeIndex]);

  // Open the menu and activate the current selection (or first enabled option).
  // Done here rather than in an effect to avoid a setState-in-effect cascade.
  function openMenu() {
    const idx = options.findIndex((o) => o.value === value);
    setActiveIndex(idx >= 0 && !options[idx].disabled ? idx : firstEnabledIndex(options));
    setOpen(true);
  }

  function commit(index: number) {
    const opt = options[index];
    if (!opt || opt.disabled) return;
    onChange(opt.value);
    setOpen(false);
  }

  function moveActive(dir: 1 | -1) {
    setActiveIndex((cur) => {
      let next = cur;
      for (let i = 0; i < options.length; i++) {
        next = (next + dir + options.length) % options.length;
        if (!options[next]?.disabled) return next;
      }
      return cur;
    });
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (disabled) return;
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (open) moveActive(1);
        else openMenu();
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (open) moveActive(-1);
        else openMenu();
        break;
      case 'Home':
        if (open) {
          e.preventDefault();
          setActiveIndex(firstEnabledIndex(options));
        }
        break;
      case 'End':
        if (open) {
          e.preventDefault();
          setActiveIndex(lastEnabledIndex(options));
        }
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (open) commit(activeIndex);
        else openMenu();
        break;
      case 'Escape':
        if (open) {
          e.preventDefault();
          setOpen(false);
        }
        break;
      case 'Tab':
        if (open) setOpen(false);
        break;
    }
  }

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        id={id}
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={() => {
          if (disabled) return;
          if (open) setOpen(false);
          else openMenu();
        }}
        onKeyDown={onKeyDown}
        className={`admin-input flex w-full items-center justify-between gap-2 text-left ${LeadingIcon ? 'pl-9' : ''}`}
      >
        {LeadingIcon && (
          <LeadingIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        )}
        <span className={`truncate ${selected ? 'text-slate-900' : 'text-slate-400'}`}>{displayLabel}</span>
        <ChevronDown className={`h-4 w-4 flex-shrink-0 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.ul
            ref={listRef}
            id={listboxId}
            role="listbox"
            aria-activedescendant={activeIndex >= 0 ? `${listboxId}-opt-${activeIndex}` : undefined}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.12 }}
            className="absolute left-0 top-full z-30 mt-1 max-h-64 w-max min-w-full max-w-[16rem] overflow-y-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg ring-1 ring-slate-900/5"
          >
            {options.map((opt, i) => {
              const isSelected = opt.value === value;
              const isActive = i === activeIndex;
              return (
                <li
                  key={opt.value}
                  id={`${listboxId}-opt-${i}`}
                  role="option"
                  aria-selected={isSelected}
                  aria-disabled={opt.disabled}
                  onMouseEnter={() => !opt.disabled && setActiveIndex(i)}
                  onClick={() => commit(i)}
                  className={`flex cursor-pointer items-center justify-between gap-2 px-3 py-2 text-sm ${
                    opt.disabled
                      ? 'cursor-not-allowed text-slate-300'
                      : isActive
                        ? 'bg-slate-50'
                        : ''
                  } ${isSelected ? 'font-medium text-teal-700' : 'text-slate-700'}`}
                >
                  <span className="truncate">{opt.label}</span>
                  {isSelected && <Check className="h-4 w-4 flex-shrink-0 text-teal-600" />}
                </li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
