import { Link, useSearchParams } from 'react-router-dom';
import { usePagination } from '@/common/hooks/usePagination';
import { formatPrice, formatDate, getImageUrl } from '@/common/utils/format.util';
import { ROUTES } from '@/common/constants/routes';
import { useSellerProducts } from '../hooks/useSellerProducts';
import { useSellerToggleProductActive } from '../hooks/useSellerToggleProductActive';
import { getPriceRange } from '../utils/product.util';
import type { AdminProductListParams } from '../types/product.types';

export default function SellerProductListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { params, setPage } = usePagination({ limit: 20, sort: 'created_at', order: 'desc' });

  const filters: AdminProductListParams = {
    ...params,
    search: searchParams.get('search') || undefined,
    category_id: searchParams.get('category_id') ? Number(searchParams.get('category_id')) : undefined,
    is_active: searchParams.get('is_active') !== null ? searchParams.get('is_active') === 'true' : undefined,
  };

  const { data, isLoading } = useSellerProducts(filters);
  const toggleActive = useSellerToggleProductActive();

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">My Products</h1>
        <Link
          to={ROUTES.SELLER_PRODUCT_CREATE}
          className="rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700"
        >
          Add Product
        </Link>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          name="search"
          type="text"
          placeholder="Search products..."
          defaultValue={searchParams.get('search') || ''}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
        />
        <button
          type="submit"
          className="rounded-md bg-gray-100 px-4 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-200"
        >
          Search
        </button>
      </form>

      <div className="overflow-x-auto rounded-lg border">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Product</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Price Range</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Variants</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Created</th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 6 }).map((__, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-4 animate-pulse rounded bg-gray-200" />
                    </td>
                  ))}
                </tr>
              ))
            ) : data && data.data.length > 0 ? (
              data.data.map((product) => {
                const range = getPriceRange(product.variants);
                return (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {product.thumbnail_url ? (
                          <img src={getImageUrl(product.thumbnail_url)} alt="" className="h-10 w-10 rounded object-cover" />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded bg-gray-100 text-xs text-gray-400">N/A</div>
                        )}
                        <span className="text-sm font-medium text-gray-900">{product.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {range ? `${formatPrice(range.min)} — ${formatPrice(range.max)}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{product.variants.length}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleActive.mutate(product.id)}
                        disabled={toggleActive.isPending}
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                          product.is_active
                            ? 'bg-green-100 text-green-800 hover:bg-green-200'
                            : 'bg-red-100 text-red-800 hover:bg-red-200'
                        }`}
                      >
                        {product.is_active ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{formatDate(product.created_at)}</td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        to={ROUTES.SELLER_PRODUCT_EDIT(product.id)}
                        className="text-sm font-medium text-amber-600 hover:text-amber-800"
                      >
                        Edit
                      </Link>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-500">
                  No products found. Create your first product to get started.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {data && data.meta.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
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
    </div>
  );
}
