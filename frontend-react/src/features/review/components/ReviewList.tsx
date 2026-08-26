import { useState } from 'react';
import { MessageSquare, Star } from 'lucide-react';
import { Button } from '@/common/components/ui/Button';
import { useProductReviews } from '../hooks/useProductReviews';
import { ReviewCard } from './ReviewCard';
import type { ReviewStats } from '../types/review.types';

interface Props {
  productId: number;
}

export function ReviewList({ productId }: Props) {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useProductReviews(productId, { page, limit: 10 });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="border-b border-border-default py-4">
            <div className="h-4 w-32 animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
            <div className="mt-2 h-3 w-48 animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
            <div className="mt-2 h-3 w-full animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
          </div>
        ))}
      </div>
    );
  }

  if (!data || data.data.length === 0) {
    return (
      <div className="flex flex-col items-center py-8 text-text-muted">
        <MessageSquare className="h-10 w-10 text-text-muted/60" />
        <p className="mt-2 text-sm font-medium">No reviews yet.</p>
      </div>
    );
  }

  return (
    <div>
      {data.stats && <ReviewSummary stats={data.stats} />}

      <div className="divide-y divide-border-default">
        {data.data.map((review) => (
          <ReviewCard key={review.id} review={review} />
        ))}
      </div>

      {data.meta.totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setPage((p) => p - 1)}
            disabled={data.meta.page <= 1}
          >
            Previous
          </Button>
          <span className="text-sm text-text-secondary">
            Page {data.meta.page} of {data.meta.totalPages}
          </span>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setPage((p) => p + 1)}
            disabled={data.meta.page >= data.meta.totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}

function ReviewSummary({ stats }: { stats: ReviewStats }) {
  return (
    <div className="mb-6 flex gap-8 border-b border-border-default pb-6">
      <div className="flex flex-col items-center">
        <span className="text-4xl font-bold tracking-tight text-text-primary">
          {stats.average_rating.toFixed(1)}
        </span>
        <div className="mt-1.5 flex gap-0.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={`h-4 w-4 ${
                i < Math.round(stats.average_rating)
                  ? 'fill-amber-400 text-amber-400'
                  : 'text-neutral-200 dark:text-neutral-600'
              }`}
            />
          ))}
        </div>
        <span className="mt-2 text-xs font-semibold text-text-muted">
          {stats.total_reviews} review{stats.total_reviews !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="flex flex-1 flex-col justify-center gap-1.5">
        {[5, 4, 3, 2, 1].map((rating) => {
          const count = stats.rating_distribution[rating] ?? 0;
          const pct = stats.total_reviews > 0 ? (count / stats.total_reviews) * 100 : 0;
          return (
            <div key={rating} className="flex items-center gap-2 text-xs font-medium text-text-secondary">
              <span className="w-4 text-right">{rating}</span>
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-hover">
                <div
                  className="h-full rounded-full bg-brand"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="w-6 text-right text-text-muted">{count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
