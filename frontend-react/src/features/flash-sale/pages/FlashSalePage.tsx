import { Zap } from 'lucide-react';
import { useActiveFlashSales } from '../hooks/useActiveFlashSales';
import { FlashSaleCard } from '../components/FlashSaleCard';
import { CountdownTimer } from '../components/CountdownTimer';

export default function FlashSalePage() {
  const { data: campaigns, isLoading } = useActiveFlashSales();

  return (
    <div className="space-y-8 py-6">
      <div className="rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 p-6 text-white">
        <div className="flex items-center gap-2.5">
          <Zap className="h-7 w-7 fill-white" />
          <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
            Flash Sale
          </h1>
        </div>
        <p className="mt-1 text-sm text-white/90">
          Limited-time deals — grab them before they're gone!
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className="aspect-[3/4] animate-pulse rounded-xl bg-neutral-200 dark:bg-neutral-800"
            />
          ))}
        </div>
      ) : !campaigns || campaigns.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          <Zap className="h-16 w-16 text-text-muted/60" />
          <h2 className="mt-4 text-lg font-semibold text-text-primary">
            No flash sales right now
          </h2>
          <p className="mt-1 text-sm text-text-secondary">
            Check back soon for limited-time deals.
          </p>
        </div>
      ) : (
        campaigns.map((campaign) => (
          <section key={campaign.id} className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-default pb-3">
              <h2 className="text-lg font-bold tracking-tight text-text-primary">
                {campaign.name}
              </h2>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-text-secondary">
                  Ends in
                </span>
                <CountdownTimer endsAt={campaign.ends_at} />
              </div>
            </div>

            {campaign.items.length === 0 ? (
              <p className="py-8 text-center text-sm text-text-secondary">
                No items in this campaign.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-5">
                {campaign.items.map((item) => (
                  <FlashSaleCard key={item.id} item={item} />
                ))}
              </div>
            )}
          </section>
        ))
      )}
    </div>
  );
}
