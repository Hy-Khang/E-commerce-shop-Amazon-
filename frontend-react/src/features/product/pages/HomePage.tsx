import { Link } from 'react-router-dom';
import { ROUTES } from '@/common/constants/routes';
import { useProducts } from '../hooks/useProducts';
import { ProductCard } from '../components/ProductCard';
import { ProductCardSkeleton } from '../components/ProductCardSkeleton';

export default function HomePage() {
  const { data, isLoading } = useProducts({ page: 1, limit: 12, sort: 'created_at', order: 'desc' });

  return (
    <div className="space-y-8">
      <section className="text-center">
        <h1 className="text-3xl font-bold text-gray-900">Welcome to Shop</h1>
        <p className="mt-2 text-gray-600">Discover our latest products</p>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">New Arrivals</h2>
          <Link to={ROUTES.PRODUCTS} className="text-sm font-medium text-blue-600 hover:text-blue-800">
            View all
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : data && data.data.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {data.data.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="py-12 text-center text-gray-500">No products available yet.</div>
        )}
      </section>
    </div>
  );
}
