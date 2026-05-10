import { useState } from 'react';
import { useDebounce } from '@/common/hooks/useDebounce';
import type { RoleWithUserCount } from '../types/admin.types';

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
  const debouncedSearch = useDebounce(search, 300);

  function handleSearchChange(value: string) {
    setSearch(value);
  }

  function handleApply() {
    onFilterChange({ search: debouncedSearch || undefined });
  }

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="flex-1 min-w-[200px]">
        <label htmlFor="search" className="block text-sm font-medium text-gray-700">
          Search
        </label>
        <input
          id="search"
          type="text"
          value={search}
          onChange={(e) => {
            handleSearchChange(e.target.value);
            onFilterChange({ search: e.target.value || undefined });
          }}
          placeholder="Search by email or name..."
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      <div className="w-40">
        <label htmlFor="role-filter" className="block text-sm font-medium text-gray-700">
          Role
        </label>
        <select
          id="role-filter"
          onChange={(e) => onFilterChange({ role: e.target.value || undefined })}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
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
        <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700">
          Status
        </label>
        <select
          id="status-filter"
          onChange={(e) => onFilterChange({ is_active: e.target.value || undefined })}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="">All</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
      </div>
    </div>
  );
}
