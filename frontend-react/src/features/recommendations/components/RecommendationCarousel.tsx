import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { SectionPanel } from '@/common/components/ui/SectionPanel';
import { ProductCard, ProductCardSkeleton } from '@/features/product';
import type { ProductListItem } from '@/features/product';

interface Props {
  title: string;
  /** Optional subtitle under the title (e.g. the recommendation reason). */
  subtitle?: string | null;
  products: ProductListItem[];
  isLoading: boolean;
  /**
   * Personalized "signature" treatment — a brand-tinted panel, a Sparkles
   * badge, the reason as a brand pill, and a "For You" chip on each card.
   * Opt-in so only the "Recommended for You" rail carries it; the Similar /
   * Frequently-bought rails keep the plain white panel.
   */
  accent?: boolean;
}

const SCROLL_AMOUNT = 560;

/**
 * Shared horizontal-scroll carousel for the recommendation surfaces, wrapped in
 * the common `SectionPanel` shell so it reads as one system with the other home
 * rails. Renders nothing when empty.
 */
export function RecommendationCarousel({
  title,
  subtitle,
  products,
  isLoading,
  accent = false,
}: Props) {
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
  }, [checkScroll, products.length]);

  if (!isLoading && products.length === 0) return null;

  return (
    <SectionPanel
      title={title}
      accent={accent ? 'brand' : 'none'}
      icon={accent ? <Sparkles className="h-5 w-5" /> : undefined}
      subtitle={
        subtitle ? (
          accent ? (
            <>
              <Sparkles className="h-3 w-3" />
              {subtitle}
            </>
          ) : (
            subtitle
          )
        ) : undefined
      }
    >
      <div className="group relative">
        {canScrollLeft && (
          <button
            type="button"
            onClick={() =>
              scrollRef.current?.scrollBy({ left: -SCROLL_AMOUNT, behavior: 'smooth' })
            }
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
                  <ProductCard
                    product={product}
                    variant={accent ? 'recommended' : 'default'}
                  />
                </div>
              ))}
        </div>

        {canScrollRight && (
          <button
            type="button"
            onClick={() =>
              scrollRef.current?.scrollBy({ left: SCROLL_AMOUNT, behavior: 'smooth' })
            }
            className="absolute right-0 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-surface shadow-md border border-border-default text-text-secondary opacity-0 group-hover:opacity-100 transition-opacity hover:text-text-primary"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        )}
      </div>
    </SectionPanel>
  );
}
