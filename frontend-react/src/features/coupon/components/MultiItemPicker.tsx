import { useState, useRef, useEffect } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import { useDebounce } from '@/common/hooks/useDebounce';
import { useAdminCategories, useAdminProducts } from '@/features/product';
import type { AdminCategory, ProductListItem } from '@/features/product';

interface PickerItem {
  id: number;
  label: string;
  sublabel?: string;
}

interface Props {
  type: 'categories' | 'products';
  selectedIds: number[];
  onChange: (ids: number[]) => void;
}

interface InternalProps {
  items: PickerItem[];
  isLoading: boolean;
  selectedIds: number[];
  onChange: (ids: number[]) => void;
  search: string;
  setSearch: (v: string) => void;
  placeholder: string;
  fallbackLabel: string;
}

function toCategoryItem(c: AdminCategory): PickerItem {
  return {
    id: c.id,
    label: c.name,
    sublabel: c.parent ? `in ${c.parent.name}` : undefined,
  };
}

function toProductItem(p: ProductListItem): PickerItem {
  return {
    id: p.id,
    label: p.name,
    sublabel: p.is_active ? undefined : '(inactive)',
  };
}

function PickerDropdown({ items, isLoading, selectedIds, onChange, search, setSearch, placeholder, fallbackLabel }: InternalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const availableItems = items.filter((item) => !selectedIds.includes(item.id));

  const selectedDisplay: PickerItem[] = selectedIds.map((id) => {
    const found = items.find((item) => item.id === id);
    return found ?? { id, label: `${fallbackLabel} #${id}` };
  });

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleSelect(id: number) {
    onChange([...selectedIds, id]);
  }

  function handleRemove(id: number) {
    onChange(selectedIds.filter((sid) => sid !== id));
  }

  return (
    <div ref={containerRef} className="relative">
      {selectedDisplay.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {selectedDisplay.map((item) => (
            <span
              key={item.id}
              className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800"
            >
              {item.label}
              <button
                type="button"
                onClick={() => handleRemove(item.id)}
                className="rounded-full p-0.5 hover:bg-blue-200"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="relative">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="w-full rounded-md border border-slate-300 py-2 pl-9 pr-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        {isLoading && (
          <Loader2 className="absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-slate-400" />
        )}
      </div>

      {isOpen && (
        <div className="absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded-md border border-slate-200 bg-white shadow-lg">
          {availableItems.length === 0 ? (
            <div className="px-3 py-2 text-sm text-slate-500">
              {isLoading ? 'Loading...' : 'No results found'}
            </div>
          ) : (
            availableItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelect(item.id)}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-blue-50"
              >
                <span className="font-medium text-slate-900">{item.label}</span>
                {item.sublabel && (
                  <span className="text-xs text-slate-500">{item.sublabel}</span>
                )}
                <span className="ml-auto text-xs text-slate-400">#{item.id}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function CategoryPicker({ selectedIds, onChange }: Omit<Props, 'type'>) {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const { data, isLoading } = useAdminCategories({ page: 1, limit: 50, search: debouncedSearch || undefined });
  const items = (data?.data ?? []).map(toCategoryItem);

  return (
    <PickerDropdown
      items={items}
      isLoading={isLoading}
      selectedIds={selectedIds}
      onChange={onChange}
      search={search}
      setSearch={setSearch}
      placeholder="Search categories..."
      fallbackLabel="Category"
    />
  );
}

function ProductPicker({ selectedIds, onChange }: Omit<Props, 'type'>) {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const { data, isLoading } = useAdminProducts({ page: 1, limit: 50, search: debouncedSearch || undefined });
  const items = (data?.data ?? []).map(toProductItem);

  return (
    <PickerDropdown
      items={items}
      isLoading={isLoading}
      selectedIds={selectedIds}
      onChange={onChange}
      search={search}
      setSearch={setSearch}
      placeholder="Search products..."
      fallbackLabel="Product"
    />
  );
}

export function MultiItemPicker({ type, selectedIds, onChange }: Props) {
  if (type === 'categories') {
    return <CategoryPicker selectedIds={selectedIds} onChange={onChange} />;
  }
  return <ProductPicker selectedIds={selectedIds} onChange={onChange} />;
}
