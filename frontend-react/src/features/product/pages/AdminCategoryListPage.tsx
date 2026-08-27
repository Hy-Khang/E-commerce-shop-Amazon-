import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ChevronRight, ChevronDown, Plus, Search, Pencil, Trash2, FolderTree } from 'lucide-react';
import { Button } from '@/common/components/ui/Button';
import { ConfirmModal } from '@/common/components/ui/ConfirmModal';
import { Drawer } from '@/common/components/ui/Drawer';
import { useCategories } from '../hooks/useCategories';
import { useAdminCategories, useCreateCategory, useDeleteCategory } from '../hooks/useAdminCategories';
import { CategoryForm } from '../components/CategoryForm';
import { CategoryEditDrawer } from '../components/CategoryEditDrawer';
import type { Category, CreateCategoryFormData } from '../types/product.types';

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
  const [deleteTarget, setDeleteTarget] = useState<TreeRow | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const search = searchParams.get('search') || '';

  const { data: treeCategories, isLoading: treeLoading } = useCategories();
  const { data: adminData, isLoading: adminLoading } = useAdminCategories({
    page: 1,
    limit: 100,
    sort: 'name',
    order: 'asc',
  });
  const createCategory = useCreateCategory();
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

  function confirmDelete() {
    if (deleteTarget) {
      deleteCategory.mutate(deleteTarget.id, {
        onSettled: () => setDeleteTarget(null),
      });
    }
  }

  function handleCreate(data: CreateCategoryFormData) {
    createCategory.mutate(
      {
        name: data.name,
        slug: data.slug,
        parent_id: data.parent_id ?? undefined,
      },
      { onSuccess: () => setShowCreate(false) },
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Categories</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Organize your product catalog</p>
        </div>
        <button
          type="button"
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-teal-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Category
        </button>
      </div>

      <div className="admin-card p-4">
        <div className="flex items-center justify-between gap-3">
          <form onSubmit={handleSearch} className="flex flex-1 gap-2">
            <div className="relative min-w-[200px] flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
              <input
                name="search"
                type="text"
                placeholder="Search categories..."
                defaultValue={search}
                className="admin-input pl-9"
              />
            </div>
            <Button type="submit" variant="secondary">Search</Button>
          </form>
          {!search && (
            <div className="flex gap-2">
              <Button variant="secondary" onClick={expandAll}>Expand All</Button>
              <Button variant="secondary" onClick={collapseAll}>Collapse All</Button>
            </div>
          )}
        </div>
      </div>

      <div className="admin-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="admin-table-header">
                <th className="px-6 py-3.5 text-left">Name</th>
                <th className="px-6 py-3.5 text-left">Slug</th>
                <th className="w-32 px-6 py-3.5 text-center">Products</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 4 }).map((__, j) => (
                      <td key={j} className="px-6 py-4">
                        <div className="h-4 w-3/4 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : displayRows.length > 0 ? (
                displayRows.map((row) => (
                  <tr
                    key={row.id}
                    className={`hover:bg-slate-50/50 transition-colors dark:hover:bg-slate-800/50 ${row.depth === 0 ? 'bg-slate-50/30 dark:bg-slate-800/30' : ''}`}
                  >
                    <td className="py-4 text-sm text-slate-900 dark:text-slate-100">
                      <div
                        className="flex items-center"
                        style={{ paddingLeft: `${row.depth * 24 + 24}px` }}
                      >
                        {row.hasChildren && !search ? (
                          <button
                            onClick={() => toggleExpand(row.id)}
                            className="mr-1.5 rounded-lg p-0.5 text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-colors dark:text-slate-500 dark:hover:bg-slate-700 dark:hover:text-slate-300"
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
                    <td className="px-6 py-4 font-mono text-sm text-slate-500 dark:text-slate-400">{row.slug}</td>
                    <td className="w-32 px-6 py-4 text-center text-sm">
                      {row.totalCount > 0 ? (
                        <span className="inline-flex items-center justify-center gap-1">
                          <span className="inline-flex items-center rounded-md bg-teal-50 px-2 py-0.5 text-xs font-medium text-teal-700 dark:bg-teal-500/15 dark:text-teal-300">
                            {row.totalCount}
                          </span>
                          {row.hasChildren && row.directCount !== row.totalCount && (
                            <span className="text-xs text-slate-400 dark:text-slate-500" title="Direct products in this category">
                              ({row.directCount})
                            </span>
                          )}
                        </span>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-500">0</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          iconOnly
                          icon={Pencil}
                          aria-label="Edit category"
                          onClick={() => setEditId(row.id)}
                        />
                        <Button
                          variant="ghost"
                          iconOnly
                          icon={Trash2}
                          aria-label="Delete category"
                          onClick={() => setDeleteTarget(row)}
                          disabled={deleteCategory.isPending}
                          className="hover:!text-rose-600"
                        />
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="py-16 text-center">
                    <FolderTree className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-600" />
                    <p className="mt-4 text-sm font-semibold text-slate-900 dark:text-slate-100">No categories found</p>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Add a category to organize your products.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {!search && !isLoading && (
        <p className="text-sm text-slate-500 dark:text-slate-400">{allRows.length} categories total</p>
      )}

      <Drawer
        open={showCreate}
        onClose={() => {
          createCategory.reset();
          setShowCreate(false);
        }}
        title="Add Category"
        variant="modal"
        size="lg"
      >
        <CategoryForm
          onSubmit={handleCreate}
          isPending={createCategory.isPending}
          error={createCategory.error}
          submitLabel="Create Category"
        />
      </Drawer>

      <CategoryEditDrawer editId={editId} onClose={() => setEditId(null)} />

      <ConfirmModal
        open={deleteTarget !== null}
        title="Delete Category"
        message={`Delete category "${deleteTarget?.name}"? This cannot be undone.`}
        variant="danger"
        confirmLabel="Delete"
        loading={deleteCategory.isPending}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
