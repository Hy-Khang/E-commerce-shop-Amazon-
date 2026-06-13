import { useState } from 'react';
import { MessageSquare, Star, Trash2, Package } from 'lucide-react';
import { usePagination } from '@/common/hooks/usePagination';
import { formatDate, getImageUrl } from '@/common/utils/format.util';
import { ConfirmModal } from '@/common/components/ui/ConfirmModal';
import { Pagination } from '@/common/components/data/Pagination';
import { useMyReviews } from '../hooks/useMyReviews';
import { useDeleteReview } from '../hooks/useDeleteReview';
import type { Review } from '../types/review.types';

export default function MyReviewsPage() {
  const { params, setPage } = usePagination({ limit: 10, sort: 'created_at', order: 'desc' });
  const { data, isLoading } = useMyReviews(params);
  const deleteReview = useDeleteReview();
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);

  function handleDelete(id: number) {
    setDeleteTarget(id);
  }

  function confirmDelete() {
    if (deleteTarget !== null) {
      deleteReview.mutate(deleteTarget, {
        onSuccess: () => {
          setDeleteTarget(null);
        },
      });
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-text-primary">My Reviews</h1>
        <p className="mt-1 text-sm text-text-secondary">View and manage your product reviews and ratings.</p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="shop-card p-5 animate-pulse space-y-4">
              <div className="flex gap-4">
                <div className="h-16 w-16 rounded-lg bg-slate-100" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-40 rounded bg-slate-100" />
                  <div className="h-3 w-24 rounded bg-slate-100" />
                </div>
              </div>
              <div className="h-4 w-full rounded bg-slate-100" />
            </div>
          ))}
        </div>
      ) : !data || data.data.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <MessageSquare className="h-14 w-14 text-text-muted" />
          <h2 className="mt-4 text-base font-semibold text-text-primary">No reviews yet</h2>
          <p className="mt-1 text-sm text-text-secondary max-w-xs">
            Your product reviews will appear here after you share your feedback on purchased products.
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {data.data.map((review) => (
              <MyReviewCard
                key={review.id}
                review={review}
                onDelete={handleDelete}
                isDeleting={deleteReview.isPending}
              />
            ))}
          </div>

          <div className="pt-4 border-t border-border-default">
            <Pagination
              page={data.meta.page}
              totalPages={data.meta.totalPages}
              onPageChange={setPage}
            />
          </div>
        </>
      )}

      <ConfirmModal
        open={deleteTarget !== null}
        title="Delete Review"
        message="Are you sure you want to delete this review? This action cannot be undone and your rating will be removed."
        variant="danger"
        confirmVariant="brand"
        confirmLabel="Delete"
        loading={deleteReview.isPending}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

interface MyReviewCardProps {
  review: Review;
  onDelete: (id: number) => void;
  isDeleting: boolean;
}

function MyReviewCard({ review, onDelete, isDeleting }: MyReviewCardProps) {
  return (
    <div className="shop-card p-5 relative overflow-hidden transition-all duration-200 hover:border-border-strong">
      <div className="flex gap-4 items-start">
        <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl border border-border-default bg-neutral-50">
          {review.product_thumbnail_url ? (
            <img
              src={getImageUrl(review.product_thumbnail_url)}
              alt={review.product_name || ''}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Package className="h-6 w-6 text-text-muted" />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-text-primary leading-tight">
                {review.product_name || `Product #${review.product_id}`}
              </p>
              
              <div className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
                <div className="flex items-center">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-3.5 w-3.5 ${
                        i < review.rating ? 'fill-amber-400 text-amber-400' : 'text-neutral-200'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-xs text-text-muted">{formatDate(review.created_at)}</span>
                {(review.variant_option1 || review.variant_option2) && (
                  <span className="inline-flex items-center gap-1 rounded bg-neutral-100 px-1.5 py-0.5 text-[10px] font-bold text-text-secondary uppercase tracking-wider">
                    {[review.variant_option1, review.variant_option2].filter(Boolean).join(' / ')}
                  </span>
                )}
              </div>
            </div>

            <button
              onClick={() => onDelete(review.id)}
              disabled={isDeleting}
              className="rounded-lg p-2 text-text-muted hover:bg-rose-50 hover:text-rose-600 transition-colors disabled:opacity-50 shrink-0"
              title="Delete Review"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>

          {review.comment && (
            <p className="mt-3.5 text-sm text-text-secondary leading-relaxed border-t border-border-default pt-3">
              {review.comment}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
