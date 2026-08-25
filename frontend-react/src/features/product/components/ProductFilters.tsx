import { Search } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { AdminSortSelect, type SortOption } from '@/common/components/data/AdminSortSelect';
import { AdminSelect } from '@/common/components/data/AdminSelect';
import { Button } from '@/common/components/ui/Button';
import { useAdminShops } from '@/features/shop';
import { useCategories } from '../hooks/useCategories';
import { flattenCategoryTree } from '../utils/product.util';

const PRODUCT_SORT_OPTIONS: SortOption[] = [
  { label: 'Newest', sort: 'created_at', order: 'desc' },
  { label: 'Oldest', sort: 'created_at', order: 'asc' },
  { label: 'Name A→Z', sort: 'name', order: 'asc' },
  { label: 'Name Z→A', sort: 'name', order: 'desc' },
];

interface ProductFiltersProps {
  /** Admin-only: show a Shop filter dropdown (URL param `shop_id`). Seller list omits it. */
  showShopFilter?: boolean;
}

/**
 * Filter toolbar shared by the admin & seller product lists. Fully URL-driven
 * (search / category_id / is_active / shop_id / sort / order) so it composes with
 * `usePagination`, which reads the same params. The Shop filter is admin-only,
 * gated behind `showShopFilter`.
 */
export function ProductFilters({ showShopFilter = false }: ProductFiltersProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: categories } = useCategories();
  const { data: shopData } = useAdminShops(
    { page: 1, limit: 100 },
    { enabled: showShopFilter },
  );

  const categoryOptions = categories ? flattenCategoryTree(categories) : [];
  const shopOptions = shopData?.data ?? [];

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
          <AdminSelect
            id="product-category"
            className="mt-1"
            value={searchParams.get('category_id') || ''}
            onChange={(v) => updateParam('category_id', v)}
            options={[
              { value: '', label: 'All categories' },
              ...categoryOptions.map((cat) => ({ value: String(cat.id), label: cat.label })),
            ]}
          />
        </div>

        {showShopFilter && (
          <div className="w-52">
            <label htmlFor="product-shop" className="block text-sm font-medium text-slate-700">
              Shop
            </label>
            <AdminSelect
              id="product-shop"
              className="mt-1"
              value={searchParams.get('shop_id') || ''}
              onChange={(v) => updateParam('shop_id', v)}
              options={[
                { value: '', label: 'All shops' },
                ...shopOptions.map((shop) => ({ value: String(shop.id), label: shop.name })),
              ]}
            />
          </div>
        )}

        <div className="w-40">
          <label htmlFor="product-status" className="block text-sm font-medium text-slate-700">
            Status
          </label>
          <AdminSelect
            id="product-status"
            className="mt-1"
            value={searchParams.get('is_active') ?? ''}
            onChange={(v) => updateParam('is_active', v)}
            options={[
              { value: '', label: 'All' },
              { value: 'true', label: 'Active' },
              { value: 'false', label: 'Inactive' },
            ]}
          />
        </div>

        <AdminSortSelect options={PRODUCT_SORT_OPTIONS} />
      </div>
    </div>
  );
}
