import { useState } from 'react';
import { Search } from 'lucide-react';
import { useDebounce } from '@/common/hooks/useDebounce';
import { AdminSortSelect, type SortOption } from '@/common/components/data/AdminSortSelect';
import { AdminSelect } from '@/common/components/data/AdminSelect';
import type { RoleWithUserCount } from '../types/admin.types';

const USER_SORT_OPTIONS: SortOption[] = [
  { label: 'Newest', sort: 'created_at', order: 'desc' },
  { label: 'Oldest', sort: 'created_at', order: 'asc' },
  { label: 'Name A→Z', sort: 'full_name', order: 'asc' },
  { label: 'Email A→Z', sort: 'email', order: 'asc' },
];

interface Props {
  roles: RoleWithUserCount[];
  onFilterChange: (filters: {
    search?: string;
    role?: string;
    is_active?: string;
  }) => void;
}

export function UserFilters({ roles, onFilterChange }: Props) {
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [isActive, setIsActive] = useState('');
  useDebounce(search, 300);

  return (
    <div className="admin-card p-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-[200px] flex-1">
          <label htmlFor="search" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            Search
          </label>
          <div className="relative mt-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
            <input
              id="search"
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                onFilterChange({ search: e.target.value || undefined });
              }}
              placeholder="Search by email or name..."
              className="admin-input pl-9"
            />
          </div>
        </div>

        <div className="w-40">
          <label htmlFor="role-filter" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            Role
          </label>
          <AdminSelect
            id="role-filter"
            className="mt-1"
            value={role}
            onChange={(v) => {
              setRole(v);
              onFilterChange({ role: v || undefined });
            }}
            options={[
              { value: '', label: 'All roles' },
              ...roles.map((r) => ({ value: r.name, label: r.name })),
            ]}
          />
        </div>

        <div className="w-40">
          <label htmlFor="status-filter" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            Status
          </label>
          <AdminSelect
            id="status-filter"
            className="mt-1"
            value={isActive}
            onChange={(v) => {
              setIsActive(v);
              onFilterChange({ is_active: v || undefined });
            }}
            options={[
              { value: '', label: 'All' },
              { value: 'true', label: 'Active' },
              { value: 'false', label: 'Inactive' },
            ]}
          />
        </div>

        <AdminSortSelect options={USER_SORT_OPTIONS} />
      </div>
    </div>
  );
}
