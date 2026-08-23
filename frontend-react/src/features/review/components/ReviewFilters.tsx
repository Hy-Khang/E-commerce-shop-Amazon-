import { useSearchParams } from 'react-router-dom';
import { AdminSortSelect, type SortOption } from '@/common/components/data/AdminSortSelect';
import { useCategories, flattenCategoryTree } from '@/features/product';

const RATING_OPTIONS = [1, 2, 3, 4, 5];

const REVIEW_SORT_OPTIONS: SortOption[] = [
  { label: 'Newest', sort: 'created_at', order: 'desc' },
  { label: 'Oldest', sort: 'created_at', order: 'asc' },
  { label: 'Rating: high → low', sort: 'rating', order: 'desc' },
  { label: 'Rating: low → high', sort: 'rating', order: 'asc' },
];

/** Rating + category + sort filter bar shared by the admin & seller review lists. URL-driven. */
export function ReviewFilters() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: categories } = useCategories();

  const categoryOptions = categories ? flattenCategoryTree(categories) : [];

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
      <div className="flex flex-wrap gap-3">
        <select
          value={searchParams.get('rating') || ''}
          onChange={(e) => updateParam('rating', e.target.value)}
          className="admin-input w-auto"
        >
          <option value="">All Ratings</option>
          {RATING_OPTIONS.map((r) => (
            <option key={r} value={r}>{r} Star{r > 1 ? 's' : ''}</option>
          ))}
        </select>

        <select
          value={searchParams.get('category_id') || ''}
          onChange={(e) => updateParam('category_id', e.target.value)}
          className="admin-input w-auto"
        >
          <option value="">All Categories</option>
          {categoryOptions.map((cat) => (
            <option key={cat.id} value={cat.id}>{cat.label}</option>
          ))}
        </select>

        <AdminSortSelect options={REVIEW_SORT_OPTIONS} bare />
      </div>
    </div>
  );
}
