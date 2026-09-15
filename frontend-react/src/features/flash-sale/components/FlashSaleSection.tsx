import { useRef } from 'react';
import { ChevronLeft, ChevronRight, Zap } from 'lucide-react';
import { ROUTES } from '@/common/constants/routes';
import { SectionPanel } from '@/common/components/ui/SectionPanel';
import { useActiveFlashSales } from '../hooks/useActiveFlashSales';
import { FlashSaleCard } from './FlashSaleCard';
import { CountdownTimer } from './CountdownTimer';

const SCROLL_AMOUNT = 440;

/**
 * Homepage "Flash Sale" strip. Self-fetches active campaigns and renders their
 * items in a horizontal carousel with a live countdown to the soonest end.
 * Renders nothing when there are no live deals.
 */
export function FlashSaleSection() {
  const { data: campaigns, isLoading } = useActiveFlashSales();
  const scrollRef = useRef<HTMLDivElement>(null);

  if (isLoading) return null;
  if (!campaigns || campaigns.length === 0) return null;

  const items = campaigns.flatMap((c) => c.items);
  if (items.length === 0) return null;

  // The nearest end time drives the strip's countdown.
  const soonestEnd = campaigns
    .map((c) => c.ends_at)
    .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())[0];

  return (
    <SectionPanel
      title="Flash Sale"
      accent="flash"
      viewAllHref={ROUTES.FLASH_SALE}
      icon={<Zap className="h-5 w-5 fill-orange-500 text-orange-600 dark:text-orange-400" />}
      headerExtra={
        soonestEnd ? (
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-medium text-text-secondary">Ends in</span>
            <CountdownTimer endsAt={soonestEnd} />
          </div>
        ) : undefined
      }
    >
      <div className="group relative">
        <button
          type="button"
          onClick={() => scrollRef.current?.scrollBy({ left: -SCROLL_AMOUNT, behavior: 'smooth' })}
          className="absolute left-0 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-orange-100 bg-surface text-orange-600 opacity-0 shadow-md transition-opacity hover:text-orange-700 group-hover:opacity-100 dark:border-orange-400/20 dark:hover:text-orange-400"
          aria-label="Scroll left"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto scroll-smooth scrollbar-hide"
          style={{ scrollSnapType: 'x mandatory' }}
        >
          {items.map((item) => (
            <div
              key={item.id}
              className="w-[200px] flex-shrink-0"
              style={{ scrollSnapAlign: 'start' }}
            >
              <FlashSaleCard item={item} />
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => scrollRef.current?.scrollBy({ left: SCROLL_AMOUNT, behavior: 'smooth' })}
          className="absolute right-0 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-orange-100 bg-surface text-orange-600 opacity-0 shadow-md transition-opacity hover:text-orange-700 group-hover:opacity-100 dark:border-orange-400/20 dark:hover:text-orange-400"
          aria-label="Scroll right"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </SectionPanel>
  );
}
