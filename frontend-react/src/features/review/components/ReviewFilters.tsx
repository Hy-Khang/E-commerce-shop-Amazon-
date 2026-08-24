import { useSearchParams } from 'react-router-dom';
import { AdminSortSelect, type SortOption } from '@/common/components/data/AdminSortSelect';
import { AdminSelect } from '@/common/components/data/AdminSelect';
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
        <AdminSelect
          ariaLabel="Filter by rating"
          className="w-40"
          value={searchParams.get('rating') || ''}
          onChange={(v) => updateParam('rating', v)}
          options={[
            { value: '', label: 'All Ratings' },
            ...RATING_OPTIONS.map((r) => ({ value: String(r), label: `${r} Star${r > 1 ? 's' : ''}` })),
          ]}
        />

        <AdminSelect
          ariaLabel="Filter by category"
          className="w-52"
          value={searchParams.get('category_id') || ''}
          onChange={(v) => updateParam('category_id', v)}
          options={[
            { value: '', label: 'All Categories' },
            ...categoryOptions.map((cat) => ({ value: String(cat.id), label: cat.label })),
          ]}
        />

        <AdminSortSelect options={REVIEW_SORT_OPTIONS} bare />
      </div>
    </div>
  );
}
