import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Loader2 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { getImageUrl } from '@/common/utils/format.util';

export type SearchItem = {
  key: string;
  label: string;
  sublabel?: string;
  to: string;
  icon: LucideIcon;
  thumbnail?: string | null;
};

export type SearchGroup = { label: string; items: SearchItem[] };

type Props = {
  value: string;
  onValueChange: (v: string) => void;
  open: boolean;
  setOpen: (o: boolean) => void;
  groups: SearchGroup[];
  isLoading: boolean;
  placeholder?: string;
  minChars?: number;
};

/**
 * Presentational + interaction shell for a portal command-palette search.
 * The container owns the query value, open state and data (groups); this box
 * renders the input + dropdown and handles keyboard nav, ⌘K focus and
 * click-outside. Reused by AdminGlobalSearch and SellerGlobalSearch.
 */
export function GlobalSearchBox({
  value,
  onValueChange,
  open,
  setOpen,
  groups,
  isLoading,
  placeholder = 'Search…',
  minChars = 2,
}: Props) {
  const navigate = useNavigate();
  const [activeIndex, setActiveIndex] = useState(0);
  const [resetKey, setResetKey] = useState('');

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const q = value.trim();
  const showDropdown = open && q.length >= minChars;

  const flatItems = useMemo(() => groups.flatMap((g) => g.items), [groups]);

  // Reset the highlighted row when the query or result set changes — during
  // render (not in an effect) to avoid a cascading re-render.
  const nextResetKey = `${q}|${flatItems.length}`;
  if (resetKey !== nextResetKey) {
    setResetKey(nextResetKey);
    setActiveIndex(0);
  }

  // ⌘K / Ctrl+K focuses the search from anywhere in the portal.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [setOpen]);

  // Close on outside click.
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [setOpen]);

  function select(item: SearchItem) {
    navigate(item.to);
    setOpen(false);
    onValueChange('');
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setOpen(true);
      setActiveIndex((i) => Math.min(flatItems.length - 1, i + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(0, i - 1));
    } else if (e.key === 'Enter') {
      const item = flatItems[activeIndex];
      if (item) {
        e.preventDefault();
        select(item);
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
      inputRef.current?.blur();
    }
  }

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => {
            onValueChange(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-16 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-500 focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:outline-none transition-colors dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:bg-slate-900"
          aria-label={placeholder}
        />
        <kbd className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 items-center gap-0.5 rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-medium text-slate-400 sm:flex dark:border-slate-700 dark:bg-slate-900 dark:text-slate-500">
          ⌘K
        </kbd>
      </div>

      {showDropdown && (
        <div className="absolute left-0 right-0 top-full z-30 mt-2 max-h-[70vh] overflow-y-auto rounded-lg border border-slate-200 bg-white py-2 shadow-lg ring-1 ring-slate-900/5 dark:border-slate-700 dark:bg-slate-900 dark:ring-white/10">
          {isLoading && flatItems.length === 0 ? (
            <div className="flex items-center justify-center gap-2 px-4 py-6 text-sm text-slate-400 dark:text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" /> Searching…
            </div>
          ) : flatItems.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-slate-400 dark:text-slate-500">
              No results for “{q}”
            </div>
          ) : (
            groups.map((group) => (
              <div key={group.label} className="mb-1 last:mb-0">
                <p className="px-4 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  {group.label}
                </p>
                {group.items.map((item) => {
                  const idx = flatItems.indexOf(item);
                  const isActive = idx === activeIndex;
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onMouseEnter={() => setActiveIndex(idx)}
                      onClick={() => select(item)}
                      className={`flex w-full items-center gap-3 px-4 py-2 text-left transition-colors ${
                        isActive ? 'bg-slate-50 dark:bg-slate-800' : 'hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      {item.thumbnail ? (
                        <img
                          src={getImageUrl(item.thumbnail)}
                          alt=""
                          className="h-8 w-8 shrink-0 rounded object-cover ring-1 ring-slate-900/5 dark:ring-white/10"
                        />
                      ) : (
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
                          <Icon className="h-4 w-4" />
                        </span>
                      )}
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                          {item.label}
                        </span>
                        {item.sublabel && (
                          <span className="block truncate text-xs text-slate-400 dark:text-slate-500">
                            {item.sublabel}
                          </span>
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
