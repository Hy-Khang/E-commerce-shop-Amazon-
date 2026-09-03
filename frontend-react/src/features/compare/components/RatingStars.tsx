import { Star } from 'lucide-react';

interface Props {
  /** Average rating, 0–5. */
  rating: number;
  /** Optional review count shown after the stars. */
  count?: number;
}

/**
 * Compact 5-star row, filled up to `rating` (rounded to the nearest half via a
 * half-width overlay). Local to the compare feature — no shared star component exists.
 */
export function RatingStars({ rating, count }: Props) {
  const rounded = Math.round(rating * 2) / 2;

  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((i) => {
          const fill = Math.max(0, Math.min(1, rounded - (i - 1)));
          return (
            <span key={i} className="relative inline-block h-3.5 w-3.5">
              <Star className="absolute inset-0 h-3.5 w-3.5 text-amber-400" />
              {fill > 0 && (
                <span
                  className="absolute inset-0 overflow-hidden"
                  style={{ width: `${fill * 100}%` }}
                >
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                </span>
              )}
            </span>
          );
        })}
      </div>
      <span className="text-xs font-medium text-text-secondary">
        {rating > 0 ? rating.toFixed(1) : '—'}
        {count != null && count > 0 && (
          <span className="text-text-muted"> ({count})</span>
        )}
      </span>
    </div>
  );
}
