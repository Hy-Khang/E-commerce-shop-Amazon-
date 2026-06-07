import { useParams } from 'react-router-dom';
import { usePagination } from '@/common/hooks/usePagination';
import { ProductCard } from '@/features/product';
import { ProductCardSkeleton } from '@/features/product/components/ProductCardSkeleton';
import { useShop } from '../hooks/useShop';
import { useShopProducts } from '../hooks/useShopProducts';
import { ShopHeader } from '../components/ShopHeader';

export default function ShopProfilePage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: shop, isLoading: shopLoading } = useShop(slug!);
  const { params, setPage } = usePagination({ limit: 20, sort: 'created_at', order: 'desc' });
  const { data: products, isLoading: productsLoading } = useShopProducts(slug!, params);

  if (shopLoading) {
    return <div className="py-12 text-center text-gray-500">Loading shop...</div>;
  }

  if (!shop) {
    return <div className="py-12 text-center text-gray-500">Shop not found.</div>;
  }

  return (
    <div className="space-y-6">
      <ShopHeader shop={shop} />

      <div>
        <h2 className="mb-4 text-lg font-semibold text-gray-900">All Products</h2>

        {productsLoading ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : products && products.data.length > 0 ? (
          <>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
              {products.data.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            {products.meta.totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-2">
                <button
                  onClick={() => setPage(products.meta.page - 1)}
                  disabled={products.meta.page <= 1}
                  className="rounded-md border px-3 py-1.5 text-sm disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-600">
                  Page {products.meta.page} of {products.meta.totalPages}
                </span>
                <button
                  onClick={() => setPage(products.meta.page + 1)}
                  disabled={products.meta.page >= products.meta.totalPages}
                  className="rounded-md border px-3 py-1.5 text-sm disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="py-12 text-center text-gray-500">No products yet.</div>
        )}
      </div>
    </div>
  );
}
