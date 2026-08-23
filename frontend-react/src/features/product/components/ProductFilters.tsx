import { Search } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { AdminSortSelect, type SortOption } from '@/common/components/data/AdminSortSelect';
import { Button } from '@/common/components/ui/Button';
import { useCategories } from '../hooks/useCategories';
import { flattenCategoryTree } from '../utils/product.util';

const PRODUCT_SORT_OPTIONS: SortOption[] = [
  { label: 'Newest', sort: 'created_at', order: 'desc' },
  { label: 'Oldest', sort: 'created_at', order: 'asc' },
  { label: 'Name A→Z', sort: 'name', order: 'asc' },
  { label: 'Name Z→A', sort: 'name', order: 'desc' },
];

/**
 * Filter toolbar shared by the admin & seller product lists. Fully URL-driven
 * (search / category_id / is_active / sort / order) so it composes with
 * `usePagination`, which reads the same params.
 */
export function ProductFilters() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: categories } = useCategories();

  const categoryOptions = categories ? flattenCategoryTree(categories) : [];

  function handleSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const search = (formData.get('search') as string)?.trim();
    setSearchParams((prev) => {
      if (search) prev.set('search', search);
      else prev.delete('search');
      prev.set('page', '1');
      return prev;
    });
  }

  function updateParam(key: string, value: string) {
    setSearchParams((prev) => {
      if (value) prev.set(key, value);
      else prev.delete(key);
      prev.set('page', '1');
      return prev;
    });
  }

  return (
    <div className="admin-card p-4">
      <div className="flex flex-wrap items-end gap-3">
        <form onSubmit={handleSearch} className="flex min-w-[220px] flex-1 items-end gap-2">
          <div className="flex-1">
            <label htmlFor="product-search" className="block text-sm font-medium text-slate-700">
              Search
            </label>
            <div className="relative mt-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                id="product-search"
                name="search"
                type="text"
                placeholder="Search products..."
                defaultValue={searchParams.get('search') || ''}
                className="admin-input pl-9"
              />
            </div>
          </div>
          <Button type="submit" variant="secondary">Search</Button>
        </form>

        <div className="w-52">
          <label htmlFor="product-category" className="block text-sm font-medium text-slate-700">
            Category
          </label>
          <select
            id="product-category"
            value={searchParams.get('category_id') || ''}
            onChange={(e) => updateParam('category_id', e.target.value)}
            className="admin-input mt-1"
          >
            <option value="">All categories</option>
            {categoryOptions.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>

        <div className="w-40">
          <label htmlFor="product-status" className="block text-sm font-medium text-slate-700">
            Status
          </label>
          <select
            id="product-status"
            value={searchParams.get('is_active') ?? ''}
            onChange={(e) => updateParam('is_active', e.target.value)}
            className="admin-input mt-1"
          >
            <option value="">All</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>

        <AdminSortSelect options={PRODUCT_SORT_OPTIONS} />
      </div>
    </div>
  );
}
