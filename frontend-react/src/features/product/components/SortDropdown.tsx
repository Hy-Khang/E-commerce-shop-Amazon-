import { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ChevronDown, Check } from 'lucide-react';

const SORT_OPTIONS = [
  { label: 'Newest', sort: 'created_at', order: 'desc' },
  { label: 'Price: Low to High', sort: 'price', order: 'asc' },
  { label: 'Price: High to Low', sort: 'price', order: 'desc' },
  { label: 'Best Selling', sort: 'best_selling', order: 'desc' },
  { label: 'Highest Rated', sort: 'rating', order: 'desc' },
] as const;

export function SortDropdown() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const [searchParams, setSearchParams] = useSearchParams();

  const currentSort = searchParams.get('sort') || 'created_at';
  const currentOrder = searchParams.get('order') || 'desc';

  const activeOption = SORT_OPTIONS.find(
    (o) => o.sort === currentSort && o.order === currentOrder,
  ) ?? SORT_OPTIONS[0];

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function selectOption(option: typeof SORT_OPTIONS[number]) {
    setSearchParams((prev) => {
      prev.set('sort', option.sort);
      prev.set('order', option.order);
      prev.set('page', '1');
      return prev;
    });
    setOpen(false);
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-2 rounded-lg border border-border-default bg-surface px-3 py-2 text-sm font-medium text-text-secondary hover:border-border-strong transition-colors"
      >
        <span className="text-text-muted">Sort:</span>
        <span className="text-text-primary">{activeOption.label}</span>
        <ChevronDown className={`h-4 w-4 text-text-muted transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 z-30 mt-1 w-52 overflow-hidden rounded-lg border border-border-default bg-elevated shadow-lg">
          {SORT_OPTIONS.map((option) => {
            const isActive = option.sort === activeOption.sort && option.order === activeOption.order;
            return (
              <button
                key={`${option.sort}-${option.order}`}
                onClick={() => selectOption(option)}
                className={`flex w-full items-center justify-between px-3 py-2 text-sm transition-colors ${
                  isActive ? 'bg-brand-light text-text-brand font-medium' : 'text-text-secondary hover:bg-surface-hover'
                }`}
              >
                {option.label}
                {isActive && <Check className="h-4 w-4" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
