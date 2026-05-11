import { useSearchParams } from 'react-router-dom';
import { usePagination } from '@/common/hooks/usePagination';
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
    <div className="flex gap-8">
      <aside className="hidden w-56 flex-shrink-0 lg:block">
        <CategorySidebar />
      </aside>

      <div className="flex-1">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              name="search"
              type="text"
              placeholder="Search products..."
              defaultValue={searchParams.get('search') || ''}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="rounded-md bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
            >
              Search
            </button>
          </form>
        </div>

        {categories && categories.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-2 lg:hidden">
            <button
              onClick={() => handleCategoryFilter(null)}
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                !filters.category_id ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleCategoryFilter(cat.id)}
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  filters.category_id === cat.id ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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
              <div className="mt-8 flex items-center justify-center gap-2">
                <button
                  onClick={() => setPage(data.meta.page - 1)}
                  disabled={data.meta.page <= 1}
                  className="rounded-md border px-3 py-1.5 text-sm disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-600">
                  Page {data.meta.page} of {data.meta.totalPages}
                </span>
                <button
                  onClick={() => setPage(data.meta.page + 1)}
                  disabled={data.meta.page >= data.meta.totalPages}
                  className="rounded-md border px-3 py-1.5 text-sm disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="py-12 text-center text-gray-500">
            {searchParams.get('search')
              ? `No products found for "${searchParams.get('search')}"`
              : 'No products available.'}
          </div>
        )}
      </div>
    </div>
  );
}
