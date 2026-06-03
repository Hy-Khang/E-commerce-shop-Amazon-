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
    <div className="border-b border-gray-100 py-4 last:border-0">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`}
                />
              ))}
            </div>
            {review.user_full_name && (
              <span className="text-sm font-medium text-gray-900">{review.user_full_name}</span>
            )}
          </div>
          <div className="mt-0.5 flex items-center gap-2">
            <span className="text-xs text-gray-500">{formatDate(review.created_at)}</span>
            {variantLabel && (
              <span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-500">
                {variantLabel}
              </span>
            )}
          </div>
        </div>

        {showDelete && onDelete && (
          <button
            onClick={() => onDelete(review.id)}
            disabled={isDeleting}
            className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500 disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>

      {review.comment && (
        <p className="mt-2 text-sm text-gray-700">{review.comment}</p>
      )}
    </div>
  );
}
