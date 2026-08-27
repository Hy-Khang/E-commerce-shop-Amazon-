import { useRef, useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ROUTES } from '@/common/constants/routes';
import { useShopProducts } from '@/features/shop';
import { ProductCard } from './ProductCard';
import { ProductCardSkeleton } from './ProductCardSkeleton';

interface Props {
  shopSlug: string;
  shopName: string;
  currentProductId: number;
}

const SCROLL_AMOUNT = 560;

export function ShopProductsCarousel({ shopSlug, shopName, currentProductId }: Props) {
  const { data, isLoading } = useShopProducts(shopSlug, { page: 1, limit: 12, sort: 'created_at', order: 'desc' });
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
  }, [checkScroll, data]);

  const products = data?.data.filter((p) => p.id !== currentProductId) ?? [];

  if (!isLoading && products.length === 0) return null;

  return (
    <section className="shop-card p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold tracking-tight text-text-primary">
          Other Products from {shopName}
        </h2>
        <Link
          to={ROUTES.SHOP_PROFILE(shopSlug)}
          className="flex items-center gap-1 text-sm font-semibold text-text-brand hover:text-primary-700 transition-colors"
        >
          View All
          <ChevronRight className="h-4 w-4" />
        </Link>
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
            : products.map((product) => (
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
