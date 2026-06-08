import { useSearchParams } from 'react-router-dom';
import { usePagination } from '@/common/hooks/usePagination';
import { Button } from '@/common/components/ui/Button';
import { useProducts } from '../hooks/useProducts';
import { useCategories } from '../hooks/useCategories';
import { ProductCard } from '../components/ProductCard';
import { ProductCardSkeleton } from '../components/ProductCardSkeleton';
import { CategorySidebar } from '../components/CategorySidebar';
import type { ProductListParams } from '../types/product.types';

export default function ProductListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { params, setPage } = usePagination({ limit: 20, sort: 'created_at', order: 'desc' });

  const filters: ProductListParams = {
    ...params,
    category_id: searchParams.get('category_id') ? Number(searchParams.get('category_id')) : undefined,
    search: searchParams.get('search') || undefined,
    min_price: searchParams.get('min_price') ? Number(searchParams.get('min_price')) : undefined,
    max_price: searchParams.get('max_price') ? Number(searchParams.get('max_price')) : undefined,
  };

  const { data, isLoading } = useProducts(filters);
  const { data: categories } = useCategories();

  function handleSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const search = formData.get('search') as string;
    setSearchParams((prev) => {
      if (search) prev.set('search', search);
      else prev.delete('search');
      prev.set('page', '1');
      return prev;
    });
  }

  function handleCategoryFilter(categoryId: number | null) {
    setSearchParams((prev) => {
      if (categoryId) prev.set('category_id', String(categoryId));
      else prev.delete('category_id');
      prev.set('page', '1');
      return prev;
    });
  }

  return (
    <div className="flex w-full gap-8">
      <aside className="hidden w-56 flex-shrink-0 lg:block">
        <CategorySidebar />
      </aside>

      <div className="flex-1 min-w-0">
        <div className="mb-6 flex w-full flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">Products</h1>
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              name="search"
              type="text"
              placeholder="Search products..."
              defaultValue={searchParams.get('search') || ''}
              className="shop-input w-full sm:w-64"
            />
            <Button type="submit">
              Search
            </Button>
          </form>
        </div>

        {categories && categories.length > 0 && (
          <div className="mb-6 flex flex-wrap gap-2 lg:hidden">
            <button
              onClick={() => handleCategoryFilter(null)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                !filters.category_id
                  ? 'bg-brand text-white'
                  : 'bg-neutral-100 text-text-secondary hover:bg-neutral-200 hover:text-text-primary'
              }`}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleCategoryFilter(cat.id)}
                className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                  filters.category_id === cat.id
                    ? 'bg-brand text-white'
                    : 'bg-neutral-100 text-text-secondary hover:bg-neutral-200 hover:text-text-primary'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        )}

        {isLoading ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : data && data.data.length > 0 ? (
          <>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
              {data.data.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            {data.meta.totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-3">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setPage(data.meta.page - 1)}
                  disabled={data.meta.page <= 1}
                >
                  Previous
                </Button>
                <span className="text-sm text-text-secondary">
                  Page {data.meta.page} of {data.meta.totalPages}
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setPage(data.meta.page + 1)}
                  disabled={data.meta.page >= data.meta.totalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="py-12 text-center text-text-secondary">
            {searchParams.get('search')
              ? `No products found for "${searchParams.get('search')}"`
              : 'No products available.'}
          </div>
        )}
      </div>
    </div>
  );
}
