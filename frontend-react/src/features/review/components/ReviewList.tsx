import { useState } from 'react';
import { MessageSquare, Star } from 'lucide-react';
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
          <div key={i} className="border-b border-gray-100 py-4">
            <div className="h-4 w-32 animate-pulse rounded bg-gray-200" />
            <div className="mt-2 h-3 w-48 animate-pulse rounded bg-gray-200" />
            <div className="mt-2 h-3 w-full animate-pulse rounded bg-gray-200" />
          </div>
        ))}
      </div>
    );
  }

  if (!data || data.data.length === 0) {
    return (
      <div className="flex flex-col items-center py-8 text-gray-400">
        <MessageSquare className="h-10 w-10" />
        <p className="mt-2 text-sm">No reviews yet.</p>
      </div>
    );
  }

  return (
    <div>
      {data.stats && <ReviewSummary stats={data.stats} />}

      <div>
        {data.data.map((review) => (
          <ReviewCard key={review.id} review={review} />
        ))}
      </div>

      {data.meta.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => p - 1)}
            disabled={data.meta.page <= 1}
            className="rounded-md border px-3 py-1.5 text-sm disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm text-gray-600">
            Page {data.meta.page} of {data.meta.totalPages}
          </span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={data.meta.page >= data.meta.totalPages}
            className="rounded-md border px-3 py-1.5 text-sm disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

function ReviewSummary({ stats }: { stats: ReviewStats }) {
  return (
    <div className="mb-6 flex gap-8 border-b border-gray-100 pb-6">
      <div className="flex flex-col items-center">
        <span className="text-4xl font-bold text-gray-900">
          {stats.average_rating.toFixed(1)}
        </span>
        <div className="mt-1 flex">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={`h-4 w-4 ${
                i < Math.round(stats.average_rating)
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-gray-200'
              }`}
            />
          ))}
        </div>
        <span className="mt-1 text-sm text-gray-500">
          {stats.total_reviews} review{stats.total_reviews !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="flex flex-1 flex-col justify-center gap-1.5">
        {[5, 4, 3, 2, 1].map((rating) => {
          const count = stats.rating_distribution[rating] ?? 0;
          const pct = stats.total_reviews > 0 ? (count / stats.total_reviews) * 100 : 0;
          return (
            <div key={rating} className="flex items-center gap-2 text-sm">
              <span className="w-6 text-right text-gray-600">{rating}</span>
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full bg-yellow-400"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="w-6 text-right text-gray-400">{count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
