import { useRef, useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Zap } from 'lucide-react';
import { motion } from 'motion/react';
import { ROUTES } from '@/common/constants/routes';
import { SaleProductCard } from './SaleProductCard';
import { ProductCardSkeleton } from './ProductCardSkeleton';
import type { HomepageProductItem } from '../types/product.types';

interface Props {
  products: HomepageProductItem[];
  isLoading?: boolean;
}

const SCROLL_AMOUNT = 440;

export function SpecialOffersSection({ products, isLoading }: Props) {
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
      className="rounded-2xl bg-gradient-to-r from-amber-50/60 via-orange-50/40 to-amber-50/60 p-6"
    >
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-amber-600" />
          <h2 className="font-display text-xl font-semibold tracking-tight text-text-primary sm:text-2xl">
            Special Offers
          </h2>
        </div>
        <Link
          to={ROUTES.PRODUCTS}
          className="text-sm font-semibold text-amber-700 hover:text-amber-800 transition-colors"
        >
          View all
        </Link>
      </div>

      <div className="group relative">
        {canScrollLeft && (
          <button
            type="button"
            onClick={() => scrollRef.current?.scrollBy({ left: -SCROLL_AMOUNT, behavior: 'smooth' })}
            className="absolute left-0 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-md border border-amber-100 text-amber-600 opacity-0 group-hover:opacity-100 transition-opacity hover:text-amber-700"
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
                  <SaleProductCard product={product} />
                </div>
              ))}
        </div>

        {canScrollRight && (
          <button
            type="button"
            onClick={() => scrollRef.current?.scrollBy({ left: SCROLL_AMOUNT, behavior: 'smooth' })}
            className="absolute right-0 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-md border border-amber-100 text-amber-600 opacity-0 group-hover:opacity-100 transition-opacity hover:text-amber-700"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        )}
      </div>
    </motion.section>
  );
}
