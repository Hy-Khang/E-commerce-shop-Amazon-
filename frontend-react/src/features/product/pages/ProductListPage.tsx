import { useState } from 'react';
import { useSearchParams, useLocation, useNavigate } from 'react-router-dom';
import { SlidersHorizontal, X, Sparkles } from 'lucide-react';
import { usePagination } from '@/common/hooks/usePagination';
import { Button } from '@/common/components/ui/Button';
import { Drawer } from '@/common/components/ui/Drawer';
import { useProducts } from '../hooks/useProducts';
import { useCategories } from '../hooks/useCategories';
import { ProductCard } from '../components/ProductCard';
import { ProductCardSkeleton } from '../components/ProductCardSkeleton';
import { CategorySidebar } from '../components/CategorySidebar';
import { FilterSidebar } from '../components/FilterSidebar';
import { SortDropdown } from '../components/SortDropdown';
import { ROUTES } from '@/common/constants/routes';
import type { ProductListParams, VisualSearchResult } from '../types/product.types';

export default function ProductListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { params, setPage } = usePagination({ limit: 20, sort: 'created_at', order: 'desc' });

  const vsResult = location.state?.visualSearch as VisualSearchResult | undefined;

  const filters: ProductListParams = {
    ...params,
    category_id: searchParams.get('category_id') ? Number(searchParams.get('category_id')) : undefined,
    search: searchParams.get('search') || undefined,
    min_price: searchParams.get('min_price') ? Number(searchParams.get('min_price')) : undefined,
    max_price: searchParams.get('max_price') ? Number(searchParams.get('max_price')) : undefined,
    min_rating: searchParams.get('min_rating') ? Number(searchParams.get('min_rating')) : undefined,
    in_stock: searchParams.get('in_stock') || undefined,
  };

  const { data, isLoading } = useProducts(filters);
  const { data: categories } = useCategories();

  function handleCategoryFilter(categoryId: number | null) {
    setSearchParams((prev) => {
      if (categoryId) prev.set('category_id', String(categoryId));
      else prev.delete('category_id');
      prev.set('page', '1');
      return prev;
    });
  }

  const searchQuery = searchParams.get('search');
  const totalResults = vsResult ? vsResult.products.meta.total : (data?.meta.total ?? 0);
  const displayProducts = vsResult ? vsResult.products.data : data?.data;

  function clearVisualSearch() {
    navigate(ROUTES.PRODUCTS, { replace: true });
  }

  return (
    <div className="flex w-full gap-8">
      {!vsResult && (
        <aside className="hidden w-56 flex-shrink-0 lg:block">
          <CategorySidebar />
          <div className="mt-6">
            <FilterSidebar />
          </div>
        </aside>
      )}

      <div className="flex-1 min-w-0">
        {vsResult && <VisualSearchBanner tags={vsResult.tags} onClear={clearVisualSearch} />}

        <div className="mb-6 flex w-full flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-text-primary">
              {vsResult ? 'Visual Search Results' : 'Products'}
            </h1>
            {(vsResult || (!isLoading && data)) && (
              <p className="mt-1 text-sm text-text-secondary">
                {totalResults} result{totalResults !== 1 ? 's' : ''}
                {!vsResult && searchQuery && (
                  <> for "<span className="font-medium text-text-primary">{searchQuery}</span>"</>
                )}
              </p>
            )}
          </div>
          {!vsResult && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setFilterDrawerOpen(true)}
                className="flex items-center gap-2 rounded-lg border border-border-default bg-white px-3 py-2 text-sm font-medium text-text-secondary hover:border-border-strong transition-colors lg:hidden"
              >
                <SlidersHorizontal className="h-4 w-4" />
                Filters
              </button>
              <SortDropdown />
            </div>
          )}
        </div>

        {!vsResult && categories && categories.length > 0 && (
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

        {!vsResult && isLoading ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : displayProducts && displayProducts.length > 0 ? (
          <>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
              {displayProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            {!vsResult && data && data.meta.totalPages > 1 && (
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
            {vsResult
              ? 'No products matched the image.'
              : searchQuery
                ? `No products found for "${searchQuery}"`
                : 'No products available.'}
          </div>
        )}
      </div>

      {!vsResult && (
        <Drawer
          open={filterDrawerOpen}
          onClose={() => setFilterDrawerOpen(false)}
          side="left"
          title="Filters"
        >
          <FilterSidebar />
        </Drawer>
      )}
    </div>
  );
}

function VisualSearchBanner({ tags, onClear }: { tags: VisualSearchResult['tags']; onClear: () => void }) {
  const tagEntries = [
    tags.category && { label: 'Category', value: tags.category },
    tags.color && { label: 'Color', value: tags.color },
    tags.material && { label: 'Material', value: tags.material },
    tags.style && { label: 'Style', value: tags.style },
  ].filter(Boolean) as { label: string; value: string }[];

  return (
    <div className="mb-6 rounded-xl border border-primary-200 bg-primary-50/50 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium text-text-brand">
          <Sparkles className="h-4 w-4" />
          AI detected attributes
        </div>
        <button
          onClick={onClear}
          className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-text-secondary hover:bg-primary-100 transition-colors"
        >
          <X className="h-3 w-3" />
          Clear
        </button>
      </div>
      <div className="mt-2.5 flex flex-wrap gap-2">
        {tagEntries.map((tag) => (
          <span
            key={tag.label}
            className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-medium text-text-primary border border-primary-200 shadow-xs"
          >
            <span className="text-text-muted">{tag.label}:</span> {tag.value}
          </span>
        ))}
        {tags.keywords.length > 0 && tags.keywords.map((kw) => (
          <span
            key={kw}
            className="inline-flex rounded-full bg-white px-3 py-1 text-xs font-medium text-text-secondary border border-neutral-200 shadow-xs"
          >
            {kw}
          </span>
        ))}
      </div>
    </div>
  );
}
