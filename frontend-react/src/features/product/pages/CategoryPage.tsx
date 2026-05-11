import { useParams } from 'react-router-dom';
import { useCategoryBySlug } from '../hooks/useCategories';
import { CategorySidebar } from '../components/CategorySidebar';
import { ProductCard } from '../components/ProductCard';
import { ProductCardSkeleton } from '../components/ProductCardSkeleton';

export default function CategoryPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data, isLoading, error } = useCategoryBySlug(slug!);

  return (
    <div className="flex gap-8">
      <aside className="hidden w-56 flex-shrink-0 lg:block">
        <CategorySidebar />
      </aside>

      <div className="flex-1">
        {isLoading ? (
          <>
            <div className="mb-6 h-8 w-48 animate-pulse rounded bg-gray-200" />
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          </>
        ) : error || !data ? (
          <div className="py-12 text-center text-gray-500">Category not found.</div>
        ) : (
          <>
            <h1 className="mb-6 text-2xl font-bold text-gray-900">{data.name}</h1>
            {data.products && data.products.length > 0 ? (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
                {data.products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-gray-500">
                No products in this category.
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
