import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Package, FolderTree, Store, Camera } from 'lucide-react';
import { ROUTES } from '@/common/constants/routes';
import { getImageUrl } from '@/common/utils/format.util';
import { useSearchSuggestions } from '../hooks/useSearchSuggestions';
import { VisualSearchModal } from './VisualSearchModal';
import type { SearchSuggestions } from '../types/product.types';

export function SearchBarWithSuggestions() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [visualSearchOpen, setVisualSearchOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: suggestions } = useSearchSuggestions(query);

  const flatItems = buildFlatItems(suggestions);
  const showDropdown = focused && query.trim().length >= 2 && flatItems.length > 0;

  // Reset the keyboard highlight whenever the query changes. Adjust state during
  // render (React docs: "storing info from previous renders") instead of an effect.
  const [prevQuery, setPrevQuery] = useState(query);
  if (query !== prevQuery) {
    setPrevQuery(query);
    setActiveIndex(-1);
  }

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setFocused(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navigateToItem = useCallback((item: FlatItem) => {
    setFocused(false);
    setQuery('');
    if (item.type === 'product') navigate(ROUTES.PRODUCT_DETAIL(item.slug));
    else if (item.type === 'category') navigate(ROUTES.CATEGORY(item.slug));
    else navigate(ROUTES.SHOP_PROFILE(item.slug));
  }, [navigate]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;

    if (activeIndex >= 0 && activeIndex < flatItems.length) {
      navigateToItem(flatItems[activeIndex]);
    } else {
      setFocused(false);
      setQuery('');
      navigate(`${ROUTES.PRODUCTS}?search=${encodeURIComponent(q)}`);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!showDropdown) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => (prev < flatItems.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : flatItems.length - 1));
    } else if (e.key === 'Escape') {
      setFocused(false);
    }
  }

  return (
    <div ref={containerRef} className="hidden flex-1 md:block relative">
      <form onSubmit={handleSubmit}>
        <div
          className={`flex items-center rounded-full border transition-all ${
            focused
              ? 'border-primary-400 bg-white ring-4 ring-primary-500/5'
              : 'border-neutral-200 bg-neutral-50/80 hover:border-neutral-300'
          }`}
        >
          <button
            type="submit"
            className="flex shrink-0 items-center justify-center pl-4 text-neutral-400 hover:text-neutral-600 transition-colors"
            aria-label="Search"
          >
            <Search className="h-[18px] w-[18px]" />
          </button>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setFocused(true)}
            onKeyDown={handleKeyDown}
            placeholder="Search for products..."
            className="w-full bg-transparent py-2.5 pl-3 pr-1 text-sm text-neutral-900 placeholder:text-neutral-400 outline-none"
            role="combobox"
            aria-expanded={showDropdown}
            aria-autocomplete="list"
            aria-activedescendant={activeIndex >= 0 ? `suggestion-${activeIndex}` : undefined}
          />
          <button
            type="button"
            onClick={() => setVisualSearchOpen(true)}
            className="flex shrink-0 items-center justify-center pr-4 text-neutral-400 hover:text-neutral-600 transition-colors"
            aria-label="Search by image"
            title="Search by image"
          >
            <Camera className="h-[18px] w-[18px]" />
          </button>
        </div>
      </form>

      {showDropdown && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1.5 overflow-hidden rounded-xl border border-border-default bg-white shadow-lg">
          <SuggestionGroup
            icon={<Package className="h-3.5 w-3.5" />}
            label="Products"
            items={suggestions!.products}
            type="product"
            query={query}
            activeIndex={activeIndex}
            startIndex={0}
            onSelect={navigateToItem}
            renderImage={(item) => (
              <img
                src={getImageUrl(item.thumbnail_url)}
                alt=""
                className="h-8 w-8 rounded object-cover bg-neutral-100"
              />
            )}
          />
          <SuggestionGroup
            icon={<FolderTree className="h-3.5 w-3.5" />}
            label="Categories"
            items={suggestions!.categories}
            type="category"
            query={query}
            activeIndex={activeIndex}
            startIndex={suggestions!.products.length}
            onSelect={navigateToItem}
          />
          <SuggestionGroup
            icon={<Store className="h-3.5 w-3.5" />}
            label="Shops"
            items={suggestions!.shops}
            type="shop"
            query={query}
            activeIndex={activeIndex}
            startIndex={suggestions!.products.length + suggestions!.categories.length}
            onSelect={navigateToItem}
            renderImage={(item) =>
              item.logo_url ? (
                <img
                  src={getImageUrl(item.logo_url)}
                  alt=""
                  className="h-6 w-6 rounded-full object-cover bg-neutral-100"
                />
              ) : null
            }
          />
        </div>
      )}
      <VisualSearchModal open={visualSearchOpen} onClose={() => setVisualSearchOpen(false)} />
    </div>
  );
}

interface FlatItem {
  type: 'product' | 'category' | 'shop';
  name: string;
  slug: string;
}

function buildFlatItems(suggestions: SearchSuggestions | undefined): FlatItem[] {
  if (!suggestions) return [];
  return [
    ...suggestions.products.map((p) => ({ type: 'product' as const, name: p.name, slug: p.slug })),
    ...suggestions.categories.map((c) => ({ type: 'category' as const, name: c.name, slug: c.slug })),
    ...suggestions.shops.map((s) => ({ type: 'shop' as const, name: s.name, slug: s.slug })),
  ];
}

function highlightMatch(text: string, query: string) {
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <span className="font-semibold text-text-primary">{text.slice(idx, idx + query.length)}</span>
      {text.slice(idx + query.length)}
    </>
  );
}

interface SuggestionGroupProps<T extends { name: string; slug: string }> {
  icon: React.ReactNode;
  label: string;
  items: T[];
  type: FlatItem['type'];
  query: string;
  activeIndex: number;
  startIndex: number;
  onSelect: (item: FlatItem) => void;
  renderImage?: (item: T) => React.ReactNode;
}

function SuggestionGroup<T extends { name: string; slug: string }>({
  icon,
  label,
  items,
  type,
  query,
  activeIndex,
  startIndex,
  onSelect,
  renderImage,
}: SuggestionGroupProps<T>) {
  if (items.length === 0) return null;

  return (
    <div>
      <div className="flex items-center gap-2 px-4 pt-2.5 pb-1 text-xs font-semibold uppercase tracking-wider text-text-muted">
        {icon}
        {label}
      </div>
      {items.map((item, i) => {
        const flatIndex = startIndex + i;
        const isActive = flatIndex === activeIndex;
        return (
          <button
            key={item.slug}
            id={`suggestion-${flatIndex}`}
            type="button"
            role="option"
            aria-selected={isActive}
            className={`flex w-full items-center gap-3 px-4 py-2 text-sm text-left transition-colors ${
              isActive ? 'bg-primary-50 text-text-primary' : 'text-text-secondary hover:bg-neutral-50'
            }`}
            onMouseDown={(e) => {
              e.preventDefault();
              onSelect({ type, name: item.name, slug: item.slug });
            }}
          >
            {renderImage?.(item)}
            <span className="truncate">{highlightMatch(item.name, query)}</span>
          </button>
        );
      })}
    </div>
  );
}
