import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ProductCard, ProductCardSkeleton } from '@/features/product';
import { useRecentlyViewed } from '../hooks/useRecentlyViewed';

interface Props {
  /** Hide this product (e.g. the one currently being viewed). */
  excludeProductId?: number;
}

const SCROLL_AMOUNT = 560;

export function RecentlyViewedCarousel({ excludeProductId }: Props) {
  const { products, isLoading } = useRecentlyViewed();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const items = products.filter((p) => p.id !== excludeProductId);

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
  }, [checkScroll, items.length]);

  if (!isLoading && items.length === 0) return null;

  return (
    <section className="shop-card p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold tracking-tight text-text-primary">
          Recently Viewed
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
                <div key={i} className="w-[180px] flex-shrink-0" style={{ scrollSnapAlign: 'start' }}>
                  <ProductCardSkeleton />
                </div>
              ))
            : items.map((product) => (
                <div key={product.id} className="w-[180px] flex-shrink-0" style={{ scrollSnapAlign: 'start' }}>
                  <ProductCard product={product} />
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
    </section>
  );
}
