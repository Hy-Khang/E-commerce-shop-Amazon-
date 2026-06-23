import { useParams } from 'react-router-dom';
import { useCategoryBySlug } from '../hooks/useCategories';
import { CategorySidebar } from '../components/CategorySidebar';
import { ProductCard } from '../components/ProductCard';
import { ProductCardSkeleton } from '../components/ProductCardSkeleton';

export default function CategoryPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data, isLoading, error } = useCategoryBySlug(slug!);

  return (
    <div className="flex w-full gap-8">
      <aside className="hidden w-56 flex-shrink-0 lg:block">
        <CategorySidebar />
      </aside>

      <div className="flex-1 min-w-0">
        {isLoading ? (
          <>
            <div className="mb-6 h-8 w-48 animate-pulse rounded bg-neutral-200" />
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          </>
        ) : error || !data ? (
          <div className="py-12 text-center text-text-secondary">Category not found.</div>
        ) : (
          <>
            <h1 className="mb-6 text-2xl font-bold tracking-tight text-text-primary">{data.category.name}</h1>
            {data.products.data && data.products.data.length > 0 ? (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
                {data.products.data.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-text-secondary">
                No products in this category.
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
