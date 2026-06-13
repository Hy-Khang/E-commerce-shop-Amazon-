import { Link } from 'react-router-dom';
import { Store, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import { ROUTES } from '@/common/constants/routes';
import type { Category } from '../types/product.types';

interface Props {
  categories: Category[];
}

export function FeaturedCategoriesSection({ categories }: Props) {
  const rootCategories = categories
    .filter((c) => !c.parent_id && c.children && c.children.length > 0)
    .slice(0, 4);

  if (rootCategories.length === 0) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <h2 className="font-display text-xl font-semibold tracking-tight text-text-primary sm:text-2xl">
        Explore Collections
      </h2>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {rootCategories.map((cat) => (
          <Link
            key={cat.id}
            to={ROUTES.CATEGORY(cat.slug)}
            className="shop-card group relative block overflow-hidden p-6 transition-all hover:border-border-strong hover:shadow-sm"
          >
            <div className="flex justify-center mb-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-light text-text-brand group-hover:scale-110 transition-transform duration-300">
                <Store className="h-6 w-6" />
              </div>
            </div>
            <h3 className="text-center text-sm font-bold text-text-primary group-hover:text-text-brand transition-colors">
              {cat.name}
            </h3>

            {cat.children && cat.children.length > 0 && (
              <div className="mt-3 flex flex-wrap justify-center gap-1.5">
                {cat.children.slice(0, 3).map((child) => (
                  <span
                    key={child.id}
                    className="inline-block rounded-full bg-primary-50 px-2.5 py-0.5 text-xs font-medium text-primary-700"
                  >
                    {child.name}
                  </span>
                ))}
                {cat.children.length > 3 && (
                  <span className="inline-block rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-medium text-text-muted">
                    +{cat.children.length - 3} more
                  </span>
                )}
              </div>
            )}

            <div className="mt-3 flex items-center justify-center gap-1 text-xs font-semibold text-text-brand opacity-0 group-hover:opacity-100 transition-opacity">
              Explore
              <ArrowRight className="h-3 w-3" />
            </div>
          </Link>
        ))}
      </div>
    </motion.section>
  );
}
