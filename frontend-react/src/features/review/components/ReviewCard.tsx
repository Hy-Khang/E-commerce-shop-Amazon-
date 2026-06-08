import { Star, Trash2 } from 'lucide-react';
import { formatDate } from '@/common/utils/format.util';
import type { Review } from '../types/review.types';

interface Props {
  review: Review;
  showDelete?: boolean;
  onDelete?: (id: number) => void;
  isDeleting?: boolean;
}

function formatVariant(review: Review): string | null {
  const parts: string[] = [];
  if (review.variant_option1) parts.push(review.variant_option1);
  if (review.variant_option2) parts.push(review.variant_option2);
  return parts.length > 0 ? parts.join(', ') : null;
}

export function ReviewCard({ review, showDelete, onDelete, isDeleting }: Props) {
  const variantLabel = formatVariant(review);

  return (
    <div className="py-5 first:pt-0 last:pb-0">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 ${i < review.rating ? 'fill-amber-400 text-amber-400' : 'text-neutral-200'}`}
                />
              ))}
            </div>
            {review.user_full_name && (
              <span className="text-sm font-semibold text-text-primary">{review.user_full_name}</span>
            )}
          </div>
          <div className="mt-1 flex items-center gap-2">
            <span className="text-xs text-text-muted">{formatDate(review.created_at)}</span>
            {variantLabel && (
              <span className="rounded bg-neutral-100 px-1.5 py-0.5 text-xs font-medium text-text-secondary">
                {variantLabel}
              </span>
            )}
          </div>
        </div>

        {showDelete && onDelete && (
          <button
            onClick={() => onDelete(review.id)}
            disabled={isDeleting}
            className="rounded-lg p-1 text-text-muted hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>

      {review.comment && (
        <p className="mt-2.5 text-sm text-text-secondary leading-relaxed">{review.comment}</p>
      )}
    </div>
  );
}
