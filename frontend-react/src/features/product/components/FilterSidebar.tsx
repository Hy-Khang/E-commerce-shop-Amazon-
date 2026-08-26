import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ChevronDown, Star, X } from 'lucide-react';
import { Button } from '@/common/components/ui/Button';

const RATING_OPTIONS = [4, 3, 2, 1] as const;

export function FilterSidebar() {
  const [searchParams, setSearchParams] = useSearchParams();

  const currentMinPrice = searchParams.get('min_price') || '';
  const currentMaxPrice = searchParams.get('max_price') || '';
  const currentMinRating = searchParams.get('min_rating');
  const currentInStock = searchParams.get('in_stock');

  const [minPrice, setMinPrice] = useState(currentMinPrice);
  const [maxPrice, setMaxPrice] = useState(currentMaxPrice);

  const hasFilters = currentMinPrice || currentMaxPrice || currentMinRating || currentInStock;

  function updateParam(key: string, value: string | null) {
    setSearchParams((prev) => {
      if (value) prev.set(key, value);
      else prev.delete(key);
      prev.set('page', '1');
      return prev;
    });
  }

  function applyPriceFilter() {
    setSearchParams((prev) => {
      if (minPrice) prev.set('min_price', minPrice);
      else prev.delete('min_price');
      if (maxPrice) prev.set('max_price', maxPrice);
      else prev.delete('max_price');
      prev.set('page', '1');
      return prev;
    });
  }

  function clearAll() {
    setSearchParams((prev) => {
      prev.delete('min_price');
      prev.delete('max_price');
      prev.delete('min_rating');
      prev.delete('in_stock');
      prev.set('page', '1');
      return prev;
    });
    setMinPrice('');
    setMaxPrice('');
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted">Filters</h3>
        {hasFilters && (
          <button
            onClick={clearAll}
            className="flex items-center gap-1 text-xs font-medium text-text-brand hover:text-primary-700 transition-colors"
          >
            <X className="h-3 w-3" />
            Clear all
          </button>
        )}
      </div>

      <FilterSection title="Price Range" defaultOpen>
        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder="Min"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            className="shop-input w-full text-sm"
            min={0}
          />
          <span className="text-text-muted">—</span>
          <input
            type="number"
            placeholder="Max"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            className="shop-input w-full text-sm"
            min={0}
          />
        </div>
        <Button size="sm" variant="secondary" onClick={applyPriceFilter} className="mt-2 w-full">
          Apply
        </Button>
      </FilterSection>

      <FilterSection title="Rating" defaultOpen>
        <div className="space-y-1">
          {RATING_OPTIONS.map((rating) => (
            <button
              key={rating}
              onClick={() => updateParam('min_rating', currentMinRating === String(rating) ? null : String(rating))}
              className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors ${
                currentMinRating === String(rating)
                  ? 'bg-brand-light text-text-brand font-medium'
                  : 'text-text-secondary hover:bg-surface-hover'
              }`}
            >
              <span className="flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-3.5 w-3.5 ${i < rating ? 'fill-amber-400 text-amber-400' : 'text-neutral-300 dark:text-neutral-600'}`}
                  />
                ))}
              </span>
              <span>& up</span>
            </button>
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Availability" defaultOpen>
        <label className="flex items-center gap-2 cursor-pointer rounded-md px-2 py-1.5 hover:bg-surface-hover transition-colors">
          <input
            type="checkbox"
            checked={currentInStock === 'true'}
            onChange={(e) => updateParam('in_stock', e.target.checked ? 'true' : null)}
            className="rounded border-neutral-300 dark:border-neutral-600 text-primary-600 focus:ring-primary-500"
          />
          <span className="text-sm text-text-secondary">In stock only</span>
        </label>
      </FilterSection>
    </div>
  );
}

function FilterSection({ title, defaultOpen = false, children }: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border-t border-border-default pt-4">
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center justify-between text-sm font-semibold text-text-primary"
      >
        {title}
        <ChevronDown className={`h-4 w-4 text-text-muted transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div className="mt-3">{children}</div>}
    </div>
  );
}
