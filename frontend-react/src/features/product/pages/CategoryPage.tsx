import { useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { SlidersHorizontal } from 'lucide-react';
import { usePagination } from '@/common/hooks/usePagination';
import { Button } from '@/common/components/ui/Button';
import { Drawer } from '@/common/components/ui/Drawer';
import { useProducts } from '../hooks/useProducts';
import { useCategoryBySlug } from '../hooks/useCategories';
import { useTrackActivity } from '@/features/recommendations';
import { CategorySidebar } from '../components/CategorySidebar';
import { FilterSidebar } from '../components/FilterSidebar';
import { SortDropdown } from '../components/SortDropdown';
import { ProductCard } from '../components/ProductCard';
import { ProductCardSkeleton } from '../components/ProductCardSkeleton';
import type { ProductListParams } from '../types/product.types';

export default function CategoryPage() {
  const { t } = useTranslation('product');
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const { params, setPage } = usePagination({ limit: 20, sort: 'created_at', order: 'desc' });

  const { data: category, isLoading: isCategoryLoading, error } = useCategoryBySlug(slug!);

  useTrackActivity(
    category?.category.id
      ? { action: 'VIEW_CATEGORY', target_type: 'category', target_id: category.category.id }
      : undefined,
  );

  const filters: ProductListParams = {
    ...params,
    category_id: category?.category.id,
    min_price: searchParams.get('min_price') ? Number(searchParams.get('min_price')) : undefined,
    max_price: searchParams.get('max_price') ? Number(searchParams.get('max_price')) : undefined,
    min_rating: searchParams.get('min_rating') ? Number(searchParams.get('min_rating')) : undefined,
    in_stock: searchParams.get('in_stock') || undefined,
  };

  const { data, isLoading: isProductsLoading } = useProducts(filters);
  const isLoading = isCategoryLoading || (!!category && isProductsLoading);

  if (error || (!isCategoryLoading && !category)) {
    return (
      <div className="flex w-full gap-8">
        <aside className="hidden w-56 flex-shrink-0 lg:block">
          <CategorySidebar />
        </aside>
        <div className="flex-1 min-w-0 py-12 text-center text-text-secondary">{t('category.notFound')}</div>
      </div>
    );
  }

  const totalResults = data?.meta.total ?? 0;

  return (
    <div className="flex w-full gap-8">
      <aside className="hidden w-56 flex-shrink-0 lg:block">
        <CategorySidebar />
        <div className="mt-6">
          <FilterSidebar />
        </div>
      </aside>

      <div className="flex-1 min-w-0">
        <div className="mb-6 flex w-full flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-text-primary">
              {category?.category.name ?? (
                <span className="inline-block h-8 w-48 animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
              )}
            </h1>
            {!isLoading && data && (
              <p className="mt-1 text-sm text-text-secondary">
                {t('list.results', { count: totalResults })}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilterDrawerOpen(true)}
              className="flex items-center gap-2 rounded-lg border border-border-default bg-surface px-3 py-2 text-sm font-medium text-text-secondary hover:border-border-strong transition-colors lg:hidden"
            >
              <SlidersHorizontal className="h-4 w-4" />
              {t('list.filters')}
            </button>
            <SortDropdown />
          </div>
        </div>

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
                  {t('pagination.previous')}
                </Button>
                <span className="text-sm text-text-secondary">
                  {t('pagination.pageOf', { page: data.meta.page, total: data.meta.totalPages })}
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setPage(data.meta.page + 1)}
                  disabled={data.meta.page >= data.meta.totalPages}
                >
                  {t('pagination.next')}
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="py-12 text-center text-text-secondary">{t('category.noProducts')}</div>
        )}
      </div>

      <Drawer
        open={filterDrawerOpen}
        onClose={() => setFilterDrawerOpen(false)}
        side="left"
        title={t('list.filters')}
      >
        <FilterSidebar />
      </Drawer>
    </div>
  );
}
