import { Link, useParams } from 'react-router-dom';
import { ROUTES } from '@/common/constants/routes';
import { useCategories } from '../hooks/useCategories';
import type { Category } from '../types/product.types';

function CategoryNode({ category, activeSlug, depth = 0 }: { category: Category; activeSlug?: string; depth?: number }) {
  const isActive = category.slug === activeSlug;

  return (
    <li>
      <Link
        to={ROUTES.CATEGORY(category.slug)}
        className={`block rounded-md px-3 py-1.5 text-sm transition-colors ${
          isActive
            ? 'bg-blue-50 font-medium text-blue-700'
            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
        }`}
        style={{ paddingLeft: `${12 + depth * 16}px` }}
      >
        {category.name}
      </Link>
      {category.children && category.children.length > 0 && (
        <ul>
          {category.children.map((child) => (
            <CategoryNode key={child.id} category={child} activeSlug={activeSlug} depth={depth + 1} />
          ))}
        </ul>
      )}
    </li>
  );
}

export function CategorySidebar() {
  const { slug } = useParams<{ slug: string }>();
  const { data: categories, isLoading } = useCategories();

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-8 animate-pulse rounded-md bg-gray-200" />
        ))}
      </div>
    );
  }

  if (!categories || categories.length === 0) return null;

  return (
    <nav>
      <h3 className="mb-3 text-sm font-semibold text-gray-900">Categories</h3>
      <ul className="space-y-0.5">
        {categories.map((cat) => (
          <CategoryNode key={cat.id} category={cat} activeSlug={slug} />
        ))}
      </ul>
    </nav>
  );
}
