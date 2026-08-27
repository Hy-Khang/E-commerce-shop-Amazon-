import { useState, useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { ROUTES } from '@/common/constants/routes';
import { useCategories } from '../hooks/useCategories';
import type { Category } from '../types/product.types';

const MAX_VISIBLE_CHILDREN = 3;

function findParentSlugs(categories: Category[], activeSlug: string): Set<string> {
  const parentSlugs = new Set<string>();

  function search(cats: Category[], ancestors: string[]): boolean {
    for (const cat of cats) {
      if (cat.slug === activeSlug) {
        ancestors.forEach((s) => parentSlugs.add(s));
        return true;
      }
      if (cat.children?.length) {
        if (search(cat.children, [...ancestors, cat.slug])) return true;
      }
    }
    return false;
  }

  search(categories, []);
  return parentSlugs;
}

function CategoryNode({ category, activeSlug, depth = 0, defaultExpanded = false }: {
  category: Category;
  activeSlug?: string;
  depth?: number;
  defaultExpanded?: boolean;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [showAll, setShowAll] = useState(false);

  const isActive = category.slug === activeSlug;
  const hasChildren = !!category.children?.length;
  const totalChildren = category.children?.length ?? 0;
  const visibleChildren = showAll
    ? category.children!
    : category.children?.slice(0, MAX_VISIBLE_CHILDREN);
  const hiddenCount = totalChildren - MAX_VISIBLE_CHILDREN;

  return (
    <li>
      <div className="flex items-center">
        {hasChildren ? (
          <button
            type="button"
            onClick={() => setExpanded((prev) => !prev)}
            className="flex shrink-0 items-center justify-center rounded p-0.5 text-text-muted hover:bg-surface-hover hover:text-text-primary transition-colors"
          >
            {expanded
              ? <ChevronDown className="size-4" />
              : <ChevronRight className="size-4" />}
          </button>
        ) : (
          <span className="w-5" />
        )}
        <Link
          to={ROUTES.CATEGORY(category.slug)}
          className={`block flex-1 rounded-md px-2 py-1.5 text-sm transition-colors ${isActive
            ? 'bg-brand-light font-semibold text-text-brand'
            : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary'
            }`}
          style={{ paddingLeft: `${4 + depth * 8}px` }}
        >
          {category.name}
        </Link>
      </div>

      {hasChildren && expanded && (
        <ul className="ml-2">
          {visibleChildren!.map((child) => (
            <CategoryNode
              key={child.id}
              category={child}
              activeSlug={activeSlug}
              depth={depth + 1}
              defaultExpanded={defaultExpanded}
            />
          ))}
          {!showAll && hiddenCount > 0 && (
            <li>
              <button
                type="button"
                onClick={() => setShowAll(true)}
                className="ml-7 py-1 text-xs font-semibold text-text-brand hover:text-primary-700 transition-colors"
              >
                +{hiddenCount} more
              </button>
            </li>
          )}
          {showAll && hiddenCount > 0 && (
            <li>
              <button
                type="button"
                onClick={() => setShowAll(false)}
                className="ml-7 py-1 text-xs font-semibold text-text-brand hover:text-primary-700 transition-colors"
              >
                Show less
              </button>
            </li>
          )}
        </ul>
      )}
    </li>
  );
}

export function CategorySidebar() {
  const { slug } = useParams<{ slug: string }>();
  const { data: categories, isLoading } = useCategories();

  const expandedParentSlugs = useMemo(() => {
    if (!categories || !slug) return new Set<string>();
    const roots = categories.filter((cat) => cat.parent_id === null);
    return findParentSlugs(roots, slug);
  }, [categories, slug]);

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-8 animate-pulse rounded-md bg-neutral-200 dark:bg-neutral-700" />
        ))}
      </div>
    );
  }

  if (!categories || categories.length === 0) return null;

  return (
    <nav>
      <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-text-muted">Categories</h3>
      <ul className="space-y-0.5">
        {categories.filter((cat) => cat.parent_id === null).map((cat) => (
          <CategoryNode
            key={cat.id}
            category={cat}
            activeSlug={slug}
            defaultExpanded={expandedParentSlugs.has(cat.slug)}
          />
        ))}
      </ul>
    </nav>
  );
}
