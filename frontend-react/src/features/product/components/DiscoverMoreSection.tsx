import { useRef, useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Compass, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import { ROUTES } from '@/common/constants/routes';
import { HomepageProductCard } from './HomepageProductCard';
import { ProductCardSkeleton } from './ProductCardSkeleton';
import type { HomepageProductItem } from '../types/product.types';

interface Props {
  products: HomepageProductItem[];
  isLoading?: boolean;
}

const SCROLL_AMOUNT = 440;

export function DiscoverMoreSection({ products, isLoading }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    checkScroll();
    el.addEventListener('scroll', checkScroll, { passive: true });
    window.addEventListener('resize', checkScroll);
    return () => {
      el.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
    };
  }, [checkScroll, products]);

  if (!isLoading && products.length === 0) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <div className="flex items-center gap-2">
        <Compass className="h-5 w-5 text-text-secondary" />
        <h2 className="font-display text-xl font-semibold tracking-tight text-text-primary sm:text-2xl">
          Discover More
        </h2>
      </div>

      <div className="group relative">
        {canScrollLeft && (
          <button
            type="button"
            onClick={() => scrollRef.current?.scrollBy({ left: -SCROLL_AMOUNT, behavior: 'smooth' })}
            className="absolute left-0 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-surface shadow-md border border-border-default text-text-secondary opacity-0 group-hover:opacity-100 transition-opacity hover:text-text-primary"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        )}

        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto scroll-smooth scrollbar-hide"
          style={{ scrollSnapType: 'x mandatory' }}
        >
          {isLoading
            ? Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="w-[200px] flex-shrink-0" style={{ scrollSnapAlign: 'start' }}>
                  <ProductCardSkeleton />
                </div>
              ))
            : products.map((product) => (
                <div key={product.id} className="w-[200px] flex-shrink-0" style={{ scrollSnapAlign: 'start' }}>
                  <HomepageProductCard product={product} />
                </div>
              ))}
        </div>

        {canScrollRight && (
          <button
            type="button"
            onClick={() => scrollRef.current?.scrollBy({ left: SCROLL_AMOUNT, behavior: 'smooth' })}
            className="absolute right-0 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-surface shadow-md border border-border-default text-text-secondary opacity-0 group-hover:opacity-100 transition-opacity hover:text-text-primary"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        )}
      </div>

      <div className="flex justify-center pt-2">
        <Link
          to={ROUTES.PRODUCTS}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-text-brand hover:text-primary-700 transition-colors"
        >
          Browse all products
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </motion.section>
  );
}
