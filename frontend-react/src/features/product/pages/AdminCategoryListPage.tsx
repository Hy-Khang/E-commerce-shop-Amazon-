import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { ROUTES } from '@/common/constants/routes';
import { useCategories } from '../hooks/useCategories';
import { useAdminCategories, useDeleteCategory } from '../hooks/useAdminCategories';
import type { Category } from '../types/product.types';

interface TreeRow {
  id: number;
  name: string;
  slug: string;
  depth: number;
  hasChildren: boolean;
  directCount: number;
  totalCount: number;
}

function computeTotalCounts(
  categories: Category[],
  directMap: Map<number, number>,
  totalMap: Map<number, number>,
): number {
  let sum = 0;
  for (const cat of categories) {
    const direct = directMap.get(cat.id) ?? 0;
    const childrenTotal = cat.children?.length
      ? computeTotalCounts(cat.children, directMap, totalMap)
      : 0;
    const total = direct + childrenTotal;
    totalMap.set(cat.id, total);
    sum += total;
  }
  return sum;
}

function flattenTree(
  categories: Category[],
  depth: number,
  collapsedIds: Set<number>,
  directMap: Map<number, number>,
  totalMap: Map<number, number>,
): TreeRow[] {
  const rows: TreeRow[] = [];
  for (const cat of categories) {
    const hasChildren = !!(cat.children && cat.children.length > 0);
    rows.push({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      depth,
      hasChildren,
      directCount: directMap.get(cat.id) ?? 0,
      totalCount: totalMap.get(cat.id) ?? 0,
    });
    if (hasChildren && !collapsedIds.has(cat.id)) {
      rows.push(...flattenTree(cat.children!, depth + 1, collapsedIds, directMap, totalMap));
    }
  }
  return rows;
}

function flattenAll(
  categories: Category[],
  depth: number,
  directMap: Map<number, number>,
  totalMap: Map<number, number>,
): TreeRow[] {
  const rows: TreeRow[] = [];
  for (const cat of categories) {
    const hasChildren = !!(cat.children && cat.children.length > 0);
    rows.push({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      depth,
      hasChildren,
      directCount: directMap.get(cat.id) ?? 0,
      totalCount: totalMap.get(cat.id) ?? 0,
    });
    if (hasChildren) {
      rows.push(...flattenAll(cat.children!, depth + 1, directMap, totalMap));
    }
  }
  return rows;
}

export default function AdminCategoryListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [collapsedIds, setCollapsedIds] = useState<Set<number>>(new Set());
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const search = searchParams.get('search') || '';

  const { data: treeCategories, isLoading: treeLoading } = useCategories();
  const { data: adminData, isLoading: adminLoading } = useAdminCategories({
    page: 1,
    limit: 100,
    sort: 'name',
    order: 'asc',
  });
  const deleteCategory = useDeleteCategory();

  const isLoading = treeLoading || adminLoading;

  const directMap = useMemo(() => {
    const map = new Map<number, number>();
    if (adminData) {
      for (const cat of adminData.data) {
        map.set(cat.id, cat.productCount);
      }
    }
    return map;
  }, [adminData]);

  const roots = useMemo(
    () => (treeCategories ?? []).filter((c) => !c.parent_id),
    [treeCategories],
  );

  const totalMap = useMemo(() => {
    const map = new Map<number, number>();
    computeTotalCounts(roots, directMap, map);
    return map;
  }, [roots, directMap]);

  const treeRows = useMemo(
    () => flattenTree(roots, 0, collapsedIds, directMap, totalMap),
    [roots, collapsedIds, directMap, totalMap],
  );

  const allRows = useMemo(
    () => flattenAll(roots, 0, directMap, totalMap),
    [roots, directMap, totalMap],
  );

  const displayRows = useMemo(() => {
    if (!search) return treeRows;
    const lower = search.toLowerCase();
    return allRows.filter(
      (row) =>
        row.name.toLowerCase().includes(lower) ||
        row.slug.toLowerCase().includes(lower),
    );
  }, [search, treeRows, allRows]);

  function toggleExpand(id: number) {
    setCollapsedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function expandAll() {
    setCollapsedIds(new Set());
  }

  function collapseAll() {
    const ids = new Set<number>();
    function collect(cats: Category[]) {
      for (const cat of cats) {
        if (cat.children?.length) {
          ids.add(cat.id);
          collect(cat.children);
        }
      }
    }
    collect(roots);
    setCollapsedIds(ids);
  }

  function handleSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const val = formData.get('search') as string;
    setSearchParams((prev) => {
      if (val) prev.set('search', val);
      else prev.delete('search');
      return prev;
    });
  }

  function handleDelete(id: number) {
    setDeletingId(id);
    deleteCategory.mutate(id, { onSettled: () => setDeletingId(null) });
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

      <div className="flex items-center justify-between">
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            name="search"
            type="text"
            placeholder="Search categories..."
            defaultValue={search}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="rounded-md bg-gray-100 px-4 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-200"
          >
            Search
          </button>
        </form>
        {!search && (
          <div className="flex gap-2">
            <button
              onClick={expandAll}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
            >
              Expand All
            </button>
            <button
              onClick={collapseAll}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
            >
              Collapse All
            </button>
          </div>
        )}
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Name</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Slug</th>
              <th className="w-32 px-4 py-3 text-center text-xs font-medium uppercase text-gray-500">Products</th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 4 }).map((__, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-4 animate-pulse rounded bg-gray-200" />
                    </td>
                  ))}
                </tr>
              ))
            ) : displayRows.length > 0 ? (
              displayRows.map((row) => (
                <tr
                  key={row.id}
                  className={`hover:bg-gray-50 ${row.depth === 0 ? 'bg-gray-50/50' : ''}`}
                >
                  <td className="py-3 text-sm text-gray-900">
                    <div
                      className="flex items-center"
                      style={{ paddingLeft: `${row.depth * 24 + 16}px` }}
                    >
                      {row.hasChildren && !search ? (
                        <button
                          onClick={() => toggleExpand(row.id)}
                          className="mr-1.5 rounded p-0.5 text-gray-400 hover:bg-gray-200 hover:text-gray-600"
                        >
                          {collapsedIds.has(row.id) ? (
                            <ChevronRight className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </button>
                      ) : (
                        <span className="mr-1.5 inline-block w-5" />
                      )}
                      <span className={row.depth === 0 ? 'font-semibold' : ''}>
                        {row.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-sm text-gray-500">{row.slug}</td>
                  <td className="w-32 px-4 py-3 text-center text-sm">
                    {row.totalCount > 0 ? (
                      <span className="inline-flex items-center justify-center gap-1">
                        <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                          {row.totalCount}
                        </span>
                        {row.hasChildren && row.directCount !== row.totalCount && (
                          <span className="text-xs text-gray-400" title="Direct products in this category">
                            ({row.directCount})
                          </span>
                        )}
                      </span>
                    ) : (
                      <span className="text-gray-400">0</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <Link
                        to={ROUTES.ADMIN_CATEGORY_EDIT(row.id)}
                        className="text-sm font-medium text-blue-600 hover:text-blue-800"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(row.id)}
                        disabled={deletingId === row.id}
                        className="text-sm font-medium text-red-600 hover:text-red-800 disabled:opacity-50"
                      >
                        {deletingId === row.id ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-sm text-gray-500">
                  No categories found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {!search && !isLoading && (
        <p className="text-sm text-gray-500">{allRows.length} categories total</p>
      )}
    </div>
  );
}
