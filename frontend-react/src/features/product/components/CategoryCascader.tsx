import { useState, useMemo } from 'react';
import { ChevronRight, Search, X, Check } from 'lucide-react';
import type { Category } from '../types/product.types';

interface CategoryCascaderProps {
  categories: Category[];
  value: number | undefined;
  onChange: (categoryId: number | undefined) => void;
  error?: string;
  /** Field label above the trigger. Pass `null` to render no label. */
  label?: string | null;
  /**
   * When true, only a leaf category (one with no children) can be confirmed —
   * products must be assigned to the most specific category. Search-select and
   * column navigation still let you pass through parents; only the final Confirm
   * is gated. Defaults to false (parents allowed) — commission/coupon pickers
   * rely on selecting a parent whose rate/scope cascades to descendants.
   */
  leafOnly?: boolean;
}

function findPathToCategory(categories: Category[], targetId: number): Category[] | null {
  for (const cat of categories) {
    if (cat.id === targetId) return [cat];
    if (cat.children?.length) {
      const path = findPathToCategory(cat.children, targetId);
      if (path) return [cat, ...path];
    }
  }
  return null;
}

function flattenCategories(
  categories: Category[],
  parentPath: string[] = [],
): { category: Category; path: string[] }[] {
  const result: { category: Category; path: string[] }[] = [];
  for (const cat of categories) {
    const currentPath = [...parentPath, cat.name];
    result.push({ category: cat, path: currentPath });
    if (cat.children?.length) {
      result.push(...flattenCategories(cat.children, currentPath));
    }
  }
  return result;
}

export function CategoryCascader({ categories, value, onChange, error, label = 'Category', leafOnly = false }: CategoryCascaderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [tempSelections, setTempSelections] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const roots = useMemo(() => categories.filter((c) => !c.parent_id), [categories]);

  const flatList = useMemo(() => flattenCategories(roots), [roots]);

  const displayPath = useMemo(() => {
    if (!value || !roots.length) return '';
    const path = findPathToCategory(roots, value);
    return path ? path.map((c) => c.name).join(' › ') : '';
  }, [value, roots]);

  const filteredSearch = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return flatList.filter(
      (item) =>
        item.category.name.toLowerCase().includes(q) ||
        item.path.join(' ').toLowerCase().includes(q),
    );
  }, [flatList, searchQuery]);

  function openModal() {
    if (value && roots.length) {
      const path = findPathToCategory(roots, value);
      setTempSelections(path ? path.map((c) => c.id) : []);
    } else {
      setTempSelections([]);
    }
    setSearchQuery('');
    setIsOpen(true);
  }

  function getCategoriesAtLevel(level: number): Category[] {
    if (level === 0) return roots;
    let current: Category[] = roots;
    for (let i = 0; i < level; i++) {
      const selected = current.find((c) => c.id === tempSelections[i]);
      if (!selected?.children?.length) return [];
      current = selected.children;
    }
    return current;
  }

  function handleSelect(level: number, categoryId: number) {
    const next = tempSelections.slice(0, level);
    next.push(categoryId);
    setTempSelections(next);
  }

  function handleSearchSelect(categoryId: number) {
    const path = findPathToCategory(roots, categoryId);
    if (path) {
      setTempSelections(path.map((c) => c.id));
    }
    setSearchQuery('');
  }

  function handleConfirm() {
    if (confirmDisabled) return;
    const finalId = tempSelections.length > 0 ? tempSelections[tempSelections.length - 1] : undefined;
    onChange(finalId);
    setIsOpen(false);
  }

  function handleCancel() {
    setIsOpen(false);
  }

  const columns: { options: Category[]; selected: number | undefined }[] = [];
  columns.push({ options: getCategoriesAtLevel(0), selected: tempSelections[0] });
  let depth = 0;
  while (depth < tempSelections.length) {
    const children = getCategoriesAtLevel(depth + 1);
    if (!children.length) break;
    columns.push({ options: children, selected: tempSelections[depth + 1] });
    depth++;
  }

  const tempPath = tempSelections
    .map((id) => flatList.find((f) => f.category.id === id)?.category.name)
    .filter(Boolean)
    .join(' › ');

  // Leaf-only gating: the final selected node must have no children to confirm.
  const finalTempId =
    tempSelections.length > 0 ? tempSelections[tempSelections.length - 1] : undefined;
  const finalTempNode =
    finalTempId != null
      ? flatList.find((f) => f.category.id === finalTempId)?.category
      : undefined;
  const isLeafSelected = finalTempNode ? (finalTempNode.children?.length ?? 0) === 0 : false;
  const confirmDisabled = tempSelections.length === 0 || (leafOnly && !isLeafSelected);

  return (
    <div>
      {label !== null && (
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">{label}</label>
      )}
      <button
        type="button"
        onClick={openModal}
        className={`admin-input flex items-center justify-between text-left ${label !== null ? 'mt-1' : ''}`}
      >
        {displayPath ? (
          <span className="truncate text-slate-900 dark:text-slate-100">{displayPath}</span>
        ) : (
          <span className="text-slate-400 dark:text-slate-500">Select a category</span>
        )}
        <ChevronRight className="ml-2 h-4 w-4 flex-shrink-0 text-slate-400 dark:text-slate-500" />
      </button>
      {error && <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{error}</p>}

      {isOpen && (
        <>
          <div className="fixed inset-0 z-70 bg-black/40 backdrop-blur-xs" onClick={handleCancel} />
          <div className="fixed inset-0 z-70 flex items-center justify-center p-4">
            <div
              className="flex w-full max-w-3xl flex-col overflow-hidden rounded-xl bg-white shadow-xl ring-1 ring-slate-900/5 dark:bg-slate-900 dark:ring-white/10"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800">
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Select a category</h3>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-300"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="border-b border-slate-200 px-5 py-3 dark:border-slate-800">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search categories..."
                    className="admin-input pl-9"
                  />
                </div>
              </div>

              <div className="h-80 overflow-hidden">
                {searchQuery.trim() ? (
                  <div className="h-full overflow-y-auto p-2">
                    {filteredSearch.length === 0 ? (
                      <p className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">No categories found</p>
                    ) : (
                      filteredSearch.map((item) => (
                        <button
                          key={item.category.id}
                          type="button"
                          onClick={() => handleSearchSelect(item.category.id)}
                          className="w-full rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-slate-50 dark:hover:bg-slate-800"
                        >
                          <span className="text-slate-400 dark:text-slate-500">
                            {item.path.slice(0, -1).join(' › ')}
                            {item.path.length > 1 ? ' › ' : ''}
                          </span>
                          <span className="font-medium text-slate-900 dark:text-slate-100">{item.category.name}</span>
                        </button>
                      ))
                    )}
                  </div>
                ) : (
                  <div className="flex h-full divide-x divide-slate-200 dark:divide-slate-800">
                    {columns.map((col, colIndex) => (
                      <div key={colIndex} className="min-w-0 flex-1 overflow-y-auto p-1.5">
                        {col.options.map((cat) => {
                          const isSelected = col.selected === cat.id;
                          const hasChildren = (cat.children?.length ?? 0) > 0;
                          return (
                            <button
                              key={cat.id}
                              type="button"
                              onClick={() => handleSelect(colIndex, cat.id)}
                              className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                                isSelected
                                  ? 'bg-teal-50 font-medium text-teal-700 dark:bg-teal-500/10 dark:text-teal-300'
                                  : 'text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800'
                              }`}
                            >
                              <span className="truncate">{cat.name}</span>
                              {hasChildren && (
                                <ChevronRight
                                  className={`ml-1 h-4 w-4 flex-shrink-0 ${isSelected ? 'text-teal-500' : 'text-slate-300 dark:text-slate-600'}`}
                                />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between border-t border-slate-200 px-5 py-4 dark:border-slate-800">
                <div className="min-w-0 flex-1 text-sm text-slate-600 dark:text-slate-400">
                  {tempPath ? (
                    <>
                      Selected:{' '}
                      <span className="font-medium text-slate-900 dark:text-slate-100">{tempPath}</span>
                      {leafOnly && !isLeafSelected && (
                        <span className="mt-0.5 block text-xs text-amber-600 dark:text-amber-400">
                          Pick a sub-category (this one still has children).
                        </span>
                      )}
                    </>
                  ) : (
                    'No category selected'
                  )}
                </div>
                <div className="ml-4 flex flex-shrink-0 gap-2">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirm}
                    disabled={confirmDisabled}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-700 disabled:opacity-50"
                  >
                    <Check className="h-4 w-4" />
                    Confirm
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
