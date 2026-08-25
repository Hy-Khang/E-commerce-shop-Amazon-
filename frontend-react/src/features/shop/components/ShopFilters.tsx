import { useState } from 'react';
import { Search } from 'lucide-react';
import { useDebounce } from '@/common/hooks/useDebounce';
import { AdminSortSelect, type SortOption } from '@/common/components/data/AdminSortSelect';
import { AdminSelect } from '@/common/components/data/AdminSelect';
import type { ShopStatus } from '../types/shop.types';
import { SHOP_STATUS_LABELS } from '../types/shop.types';

interface Props {
  onFilterChange: (filters: {
    search?: string;
    status?: ShopStatus | '';
  }) => void;
  initialStatus?: ShopStatus | '';
}

const statusOptions = Object.entries(SHOP_STATUS_LABELS) as [ShopStatus, string][];

const SHOP_SORT_OPTIONS: SortOption[] = [
  { label: 'Newest', sort: 'created_at', order: 'desc' },
  { label: 'Oldest', sort: 'created_at', order: 'asc' },
  { label: 'Name A→Z', sort: 'name', order: 'asc' },
];

export function ShopFilters({ onFilterChange, initialStatus = '' }: Props) {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>(initialStatus);
  useDebounce(search, 300);

  return (
    <div className="admin-card p-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-[200px] flex-1">
          <label htmlFor="shop-search" className="block text-sm font-medium text-slate-700">
            Search
          </label>
          <div className="relative mt-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              id="shop-search"
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                onFilterChange({ search: e.target.value || undefined });
              }}
              placeholder="Search by shop name..."
              className="admin-input pl-9"
            />
          </div>
        </div>

        <div className="w-48">
          <label htmlFor="shop-status-filter" className="block text-sm font-medium text-slate-700">
            Status
          </label>
          <AdminSelect
            id="shop-status-filter"
            className="mt-1"
            value={status}
            onChange={(v) => {
              setStatus(v);
              onFilterChange({ status: (v as ShopStatus) || undefined });
            }}
            options={[
              { value: '', label: 'All statuses' },
              ...statusOptions.map(([value, label]) => ({ value, label })),
            ]}
          />
        </div>

        <AdminSortSelect options={SHOP_SORT_OPTIONS} />
      </div>
    </div>
  );
}
