import { useState, useMemo } from 'react';
import type { Category } from '../types/product.types';

interface CategoryCascaderProps {
  categories: Category[];
  value: number | undefined;
  onChange: (categoryId: number | undefined) => void;
  error?: string;
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

export function CategoryCascader({ categories, value, onChange, error }: CategoryCascaderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [tempSelections, setTempSelections] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const roots = useMemo(() => categories.filter((c) => !c.parent_id), [categories]);

  const flatList = useMemo(() => flattenCategories(roots), [roots]);

  const displayPath = useMemo(() => {
    if (!value || !roots.length) return '';
    const path = findPathToCategory(roots, value);
    return path ? path.map((c) => c.name).join(' > ') : '';
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
    .join(' > ');

  return (
    <div>
      <label className="block text-sm font-medium text-slate-700">Category</label>
      <button
        type="button"
        onClick={openModal}
        className="mt-1 flex w-full items-center justify-between rounded-md border border-slate-300 bg-white px-3 py-2 text-left text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      >
        {displayPath ? (
          <span className="truncate text-slate-900">{displayPath}</span>
        ) : (
          <span className="text-slate-400">Chọn danh mục</span>
        )}
        <svg className="ml-2 h-4 w-4 flex-shrink-0 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
      {error && <p className="mt-1 text-xs text-rose-600">{error}</p>}

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/50" onClick={handleCancel} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="flex w-full max-w-4xl flex-col rounded-lg bg-white shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b px-6 py-4">
                <h3 className="text-lg font-semibold text-slate-900">Chọn danh mục</h3>
                <button type="button" onClick={handleCancel} className="text-slate-400 hover:text-slate-600">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="border-b px-6 py-3">
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Tìm kiếm danh mục..."
                    className="w-full rounded-md border border-slate-300 py-2 pl-9 pr-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <svg
                    className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>

              <div className="h-80 overflow-hidden">
                {searchQuery.trim() ? (
                  <div className="h-full overflow-y-auto p-2">
                    {filteredSearch.length === 0 ? (
                      <p className="py-8 text-center text-sm text-slate-500">Không tìm thấy danh mục</p>
                    ) : (
                      filteredSearch.map((item) => (
                        <button
                          key={item.category.id}
                          type="button"
                          onClick={() => handleSearchSelect(item.category.id)}
                          className="w-full rounded px-3 py-2 text-left text-sm hover:bg-slate-100"
                        >
                          <span className="text-slate-400">
                            {item.path.slice(0, -1).join(' > ')}
                            {item.path.length > 1 ? ' > ' : ''}
                          </span>
                          <span className="font-medium text-slate-900">{item.category.name}</span>
                        </button>
                      ))
                    )}
                  </div>
                ) : (
                  <div className="flex h-full divide-x divide-slate-200">
                    {columns.map((col, colIndex) => (
                      <div key={colIndex} className="min-w-0 flex-1 overflow-y-auto">
                        {col.options.map((cat) => {
                          const isSelected = col.selected === cat.id;
                          const hasChildren = (cat.children?.length ?? 0) > 0;
                          return (
                            <button
                              key={cat.id}
                              type="button"
                              onClick={() => handleSelect(colIndex, cat.id)}
                              className={`flex w-full items-center justify-between px-4 py-2.5 text-left text-sm transition-colors ${
                                isSelected
                                  ? 'bg-orange-50 font-medium text-orange-600'
                                  : 'text-slate-700 hover:bg-slate-50'
                              }`}
                            >
                              <span className="truncate">{cat.name}</span>
                              {hasChildren && (
                                <svg
                                  className={`ml-1 h-4 w-4 flex-shrink-0 ${isSelected ? 'text-orange-500' : 'text-slate-400'}`}
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between border-t px-6 py-4">
                <div className="min-w-0 flex-1 text-sm text-slate-600">
                  {tempPath ? (
                    <>
                      Đã chọn:{' '}
                      <span className="font-medium text-slate-900">{tempPath}</span>
                    </>
                  ) : (
                    'Chưa chọn danh mục'
                  )}
                </div>
                <div className="ml-4 flex flex-shrink-0 gap-3">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirm}
                    disabled={tempSelections.length === 0}
                    className="rounded-md bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 disabled:opacity-50"
                  >
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
