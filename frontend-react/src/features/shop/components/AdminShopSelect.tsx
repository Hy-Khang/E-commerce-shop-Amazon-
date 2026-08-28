import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, Loader2, Search, Store, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useDebounce } from '@/common/hooks/useDebounce';
import { useAdminShops } from '../hooks/useAdminShops';
import { useAdminShop } from '../hooks/useAdminShop';

interface AdminShopSelectProps {
  /** Selected shop id, or `null` for the "none" row. */
  value: number | null;
  /** Emits the chosen shop id, or `null` when the none row is picked. */
  onChange: (value: number | null) => void;
  /** Associates a visible `<label htmlFor={id}>` with the trigger. */
  id?: string;
  /** Accessible name — use when there is no visible `<label htmlFor>`. */
  ariaLabel?: string;
  /** Label for the top "none" row and the muted empty trigger (e.g. "— No shop —", "All shops"). */
  noneLabel?: string;
  /** Classes for the root wrapper — carry width/spacing here (e.g. `w-52`, `mt-1`). */
  className?: string;
  disabled?: boolean;
}

/**
 * Searchable, async shop picker for admin/seller portals. Unlike a plain
 * `<select>` populated with a capped page of shops, this debounces a query
 * against `/admin/shops?search=` so it scales past a handful of shops. The
 * current selection's name is resolved via `useAdminShop(value)` so the trigger
 * stays correct even when the shop is absent from the current search page.
 *
 * Drop-in for the null-aware form/filter contract: `value: number | null` +
 * `onChange(id | null)`. Trigger reuses the `.admin-input` token; popup styling
 * mirrors `AdminSelect`.
 */
export function AdminShopSelect({
  value,
  onChange,
  id,
  ariaLabel,
  noneLabel = '— No shop —',
  className = '',
  disabled = false,
}: AdminShopSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const reactId = useId();
  const listboxId = `${id ?? reactId}-listbox`;

  const debouncedSearch = useDebounce(search, 250);
  const { data: shopData, isFetching } = useAdminShops(
    { page: 1, limit: 20, search: debouncedSearch || undefined },
    { enabled: open },
  );
  const shops = useMemo(() => shopData?.data ?? [], [shopData]);

  // Resolve the selected shop's name even when it isn't on the current page.
  const { data: selectedShop } = useAdminShop(value ?? 0);
  const selectedName =
    value == null
      ? null
      : shops.find((s) => s.id === value)?.name ?? selectedShop?.name ?? `Shop #${value}`;

  // Rows: the "none" row first, then the search results.
  const rows = useMemo(
    () => [{ id: null as number | null, name: noneLabel }, ...shops.map((s) => ({ id: s.id as number | null, name: s.name }))],
    [shops, noneLabel],
  );
  const [activeIndex, setActiveIndex] = useState(0);

  // Close when clicking outside.
  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open]);

  // Focus the search box whenever the menu opens. The active row is reset in the
  // search `onChange` (and on open) rather than in an effect, to avoid a
  // setState-in-effect cascade.
  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  function openMenu() {
    setSearch('');
    setActiveIndex(0);
    setOpen(true);
  }

  function commit(index: number) {
    const row = rows[index];
    if (row === undefined) return;
    onChange(row.id);
    setOpen(false);
  }

  function onInputKeyDown(e: React.KeyboardEvent) {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, rows.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        commit(activeIndex);
        break;
      case 'Escape':
        e.preventDefault();
        setOpen(false);
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
        onClick={() => (open ? setOpen(false) : openMenu())}
        onKeyDown={(e) => {
          if (disabled) return;
          if ((e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') && !open) {
            e.preventDefault();
            openMenu();
          }
        }}
        className={`admin-input flex w-full items-center gap-2 pl-9 text-left ${value != null && !disabled ? 'pr-14' : 'pr-9'}`}
      >
        <Store className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
        <span className={`min-w-0 flex-1 truncate ${selectedName ? 'text-slate-900 dark:text-slate-100' : 'text-slate-400 dark:text-slate-500'}`}>
          {selectedName ?? noneLabel}
        </span>
      </button>

      {/* Chevron + clear are siblings of the trigger (never nested inside it, which
          would be invalid interactive-in-button markup). The wrapper ignores
          pointer events; only the clear button re-enables them. */}
      <div className="pointer-events-none absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
        {value != null && !disabled && (
          <button
            type="button"
            tabIndex={-1}
            aria-label="Clear shop"
            onClick={() => onChange(null)}
            className="pointer-events-auto rounded p-0.5 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
        <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform dark:text-slate-500 ${open ? 'rotate-180' : ''}`} />
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.12 }}
            className="absolute left-0 top-full z-30 mt-1 w-full min-w-[14rem] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg ring-1 ring-slate-900/5 dark:border-slate-700 dark:bg-slate-900 dark:ring-white/10"
          >
            <div className="relative border-b border-slate-100 p-2 dark:border-slate-800">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
              <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setActiveIndex(0);
                }}
                onKeyDown={onInputKeyDown}
                placeholder="Search shops..."
                className="admin-input pl-9"
              />
            </div>
            <ul id={listboxId} role="listbox" className="max-h-60 overflow-y-auto py-1">
              {rows.map((row, i) => {
                const isSelected = row.id === value;
                const isActive = i === activeIndex;
                const isNoneRow = row.id === null;
                return (
                  <li
                    key={row.id ?? 'none'}
                    role="option"
                    aria-selected={isSelected}
                    onMouseEnter={() => setActiveIndex(i)}
                    onClick={() => commit(i)}
                    className={`flex cursor-pointer items-center justify-between gap-2 px-3 py-2 text-sm ${
                      isActive ? 'bg-slate-50 dark:bg-slate-800' : ''
                    } ${
                      isSelected
                        ? 'font-medium text-teal-700 dark:text-teal-300'
                        : isNoneRow
                          ? 'text-slate-400 dark:text-slate-500'
                          : 'text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span className="truncate">{row.name}</span>
                    {isSelected && <Check className="h-4 w-4 flex-shrink-0 text-teal-600 dark:text-teal-400" />}
                  </li>
                );
              })}
              {isFetching && (
                <li className="flex items-center gap-2 px-3 py-2 text-sm text-slate-400 dark:text-slate-500">
                  <Loader2 className="h-4 w-4 animate-spin" /> Searching…
                </li>
              )}
              {!isFetching && shops.length === 0 && debouncedSearch && (
                <li className="px-3 py-2 text-sm text-slate-400 dark:text-slate-500">No shops match “{debouncedSearch}”.</li>
              )}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
