import { ArrowUpDown } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { AdminSelect, type AdminSelectOption } from './AdminSelect';

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

  const selectOptions: AdminSelectOption[] = options.map((opt) => ({
    value: `${opt.sort}:${opt.order}`,
    label: opt.label,
  }));

  function handleChange(next: string) {
    const [sort, order] = next.split(':');
    setSearchParams((prev) => {
      prev.set('sort', sort);
      prev.set('order', order);
      prev.set('page', '1');
      return prev;
    });
  }

  const select = (
    <AdminSelect
      id="admin-sort"
      ariaLabel={label}
      value={currentValue}
      onChange={handleChange}
      options={selectOptions}
      leadingIcon={ArrowUpDown}
      className={bare ? 'w-48' : ''}
    />
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
