import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { usePagination } from '@/common/hooks/usePagination';
import { ROUTES } from '@/common/constants/routes';
import { useAdminCategories, useDeleteCategory } from '../hooks/useAdminCategories';
import { useCategories } from '../hooks/useCategories';
import type { AdminCategoryListParams } from '../types/product.types';

export default function AdminCategoryListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { params, setPage } = usePagination({ limit: 20, sort: 'name', order: 'asc' });
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const filters: AdminCategoryListParams = {
    ...params,
    search: searchParams.get('search') || undefined,
    parent_id: searchParams.get('parent_id') ? Number(searchParams.get('parent_id')) : undefined,
  };

  const { data, isLoading } = useAdminCategories(filters);
  const { data: allCategories } = useCategories();
  const deleteCategory = useDeleteCategory();

  const parentMap = useMemo(() => {
    const map = new Map<number, string>();
    if (allCategories) {
      const flatten = (cats: typeof allCategories) => {
        for (const cat of cats) {
          map.set(cat.id, cat.name);
          if (cat.children) flatten(cat.children);
        }
      };
      flatten(allCategories);
    }
    return map;
  }, [allCategories]);

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

  function handleDelete(id: number) {
    setDeletingId(id);
    deleteCategory.mutate(id, {
      onSettled: () => setDeletingId(null),
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
        <Link
          to={ROUTES.ADMIN_CATEGORY_CREATE}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Add Category
        </Link>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          name="search"
          type="text"
          placeholder="Search categories..."
          defaultValue={searchParams.get('search') || ''}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
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
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Name</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Slug</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Parent</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Products</th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 5 }).map((__, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-4 animate-pulse rounded bg-gray-200" />
                    </td>
                  ))}
                </tr>
              ))
            ) : data && data.data.length > 0 ? (
              data.data.map((category) => (
                <tr key={category.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{category.name}</td>
                  <td className="px-4 py-3 text-sm font-mono text-gray-600">{category.slug}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {category.parent_id ? parentMap.get(category.parent_id) ?? '—' : '—'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{category.productCount}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <Link
                        to={ROUTES.ADMIN_CATEGORY_EDIT(category.id)}
                        className="text-sm font-medium text-blue-600 hover:text-blue-800"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(category.id)}
                        disabled={deletingId === category.id}
                        className="text-sm font-medium text-red-600 hover:text-red-800 disabled:opacity-50"
                      >
                        {deletingId === category.id ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-500">
                  No categories found.
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
