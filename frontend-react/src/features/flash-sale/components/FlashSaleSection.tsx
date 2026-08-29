import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Zap } from 'lucide-react';
import { motion } from 'motion/react';
import { ROUTES } from '@/common/constants/routes';
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
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.5 }}
      className="rounded-2xl bg-gradient-to-r from-amber-50/70 via-orange-50/50 to-amber-50/70 p-6 dark:from-amber-500/[0.08] dark:via-orange-500/[0.05] dark:to-amber-500/[0.08] dark:ring-1 dark:ring-inset dark:ring-amber-500/10"
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Zap className="h-5 w-5 fill-amber-500 text-amber-600 dark:text-amber-400" />
          <h2 className="font-display text-xl font-semibold tracking-tight text-text-primary sm:text-2xl">
            Flash Sale
          </h2>
          {soonestEnd && (
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-medium text-text-secondary">Kết thúc trong</span>
              <CountdownTimer endsAt={soonestEnd} />
            </div>
          )}
        </div>
        <Link
          to={ROUTES.FLASH_SALE}
          className="text-sm font-semibold text-amber-700 transition-colors hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-300"
        >
          View all
        </Link>
      </div>

      <div className="group relative">
        <button
          type="button"
          onClick={() => scrollRef.current?.scrollBy({ left: -SCROLL_AMOUNT, behavior: 'smooth' })}
          className="absolute left-0 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-amber-100 bg-surface text-amber-600 opacity-0 shadow-md transition-opacity hover:text-amber-700 group-hover:opacity-100 dark:border-amber-400/20 dark:hover:text-amber-400"
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
          className="absolute right-0 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-amber-100 bg-surface text-amber-600 opacity-0 shadow-md transition-opacity hover:text-amber-700 group-hover:opacity-100 dark:border-amber-400/20 dark:hover:text-amber-400"
          aria-label="Scroll right"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </motion.section>
  );
}
