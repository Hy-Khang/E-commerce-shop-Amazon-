import { ArrowUpDown } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';

export interface SortOption {
  label: string;
  sort: string;
  order: 'asc' | 'desc';
}

interface AdminSortSelectProps {
  options: SortOption[];
  /** Label rendered above the select (labeled variant only). */
  label?: string;
  /** Bare variant: no label, `w-auto` — fits inline select toolbars. */
  bare?: boolean;
  className?: string;
}

/**
 * URL-driven sort dropdown. Reads `sort`/`order` from the query string and, on
 * change, writes them back (resetting `page` to 1). The first option is treated
 * as the default when the URL carries no sort — keep it aligned with the
 * `usePagination` defaults of the page that renders it.
 */
export function AdminSortSelect({ options, label = 'Sort by', bare = false, className }: AdminSortSelectProps) {
  const [searchParams, setSearchParams] = useSearchParams();

  const currentSort = searchParams.get('sort') ?? options[0]?.sort;
  const currentOrder = searchParams.get('order') ?? options[0]?.order;
  const currentValue = `${currentSort}:${currentOrder}`;

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const [sort, order] = e.target.value.split(':');
    setSearchParams((prev) => {
      prev.set('sort', sort);
      prev.set('order', order);
      prev.set('page', '1');
      return prev;
    });
  }

  const select = (
    <div className="relative">
      <ArrowUpDown className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <select
        id="admin-sort"
        aria-label={label}
        value={currentValue}
        onChange={handleChange}
        className={`admin-input pl-9 ${bare ? 'w-auto' : ''}`}
      >
        {options.map((opt) => (
          <option key={`${opt.sort}:${opt.order}`} value={`${opt.sort}:${opt.order}`}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );

  if (bare) return select;

  return (
    <div className={className ?? 'w-52'}>
      <label htmlFor="admin-sort" className="block text-sm font-medium text-slate-700">
        {label}
      </label>
      <div className="mt-1">{select}</div>
    </div>
  );
}
