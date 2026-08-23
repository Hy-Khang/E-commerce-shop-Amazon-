import { useState } from 'react';
import { Search } from 'lucide-react';
import { useDebounce } from '@/common/hooks/useDebounce';
import { AdminSortSelect, type SortOption } from '@/common/components/data/AdminSortSelect';
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
  useDebounce(search, 300);

  return (
    <div className="admin-card p-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-[200px] flex-1">
          <label htmlFor="search" className="block text-sm font-medium text-slate-700">
            Search
          </label>
          <div className="relative mt-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
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
          <label htmlFor="role-filter" className="block text-sm font-medium text-slate-700">
            Role
          </label>
          <select
            id="role-filter"
            onChange={(e) => onFilterChange({ role: e.target.value || undefined })}
            className="admin-input mt-1"
          >
            <option value="">All roles</option>
            {roles.map((role) => (
              <option key={role.id} value={role.name}>
                {role.name}
              </option>
            ))}
          </select>
        </div>

        <div className="w-40">
          <label htmlFor="status-filter" className="block text-sm font-medium text-slate-700">
            Status
          </label>
          <select
            id="status-filter"
            onChange={(e) => onFilterChange({ is_active: e.target.value || undefined })}
            className="admin-input mt-1"
          >
            <option value="">All</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>

        <AdminSortSelect options={USER_SORT_OPTIONS} />
      </div>
    </div>
  );
}
