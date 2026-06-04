import { useState } from 'react';
import { MessageSquare, Star, Trash2, Package } from 'lucide-react';
import { usePagination } from '@/common/hooks/usePagination';
import { formatDate } from '@/common/utils/format.util';
import { ConfirmModal } from '@/common/components/ui/ConfirmModal';
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
      deleteReview.mutate(deleteTarget);
      setDeleteTarget(null);
    }
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">My Reviews</h1>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-lg border bg-white p-4">
              <div className="flex gap-4">
                <div className="h-16 w-16 animate-pulse rounded bg-gray-200" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-40 animate-pulse rounded bg-gray-200" />
                  <div className="h-3 w-24 animate-pulse rounded bg-gray-200" />
                  <div className="h-3 w-full animate-pulse rounded bg-gray-200" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : !data || data.data.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16">
          <MessageSquare className="h-16 w-16 text-gray-300" />
          <h2 className="mt-4 text-lg font-medium text-gray-900">No reviews yet</h2>
          <p className="mt-1 text-sm text-gray-500">
            Your reviews will appear here after you review a purchased product.
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

          {data.meta.totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-2">
              <button
                onClick={() => setPage(data.meta.page - 1)}
                disabled={data.meta.page <= 1}
                className="rounded-md border px-3 py-1.5 text-sm disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-sm text-gray-600">
                Page {data.meta.page} of {data.meta.totalPages}
              </span>
              <button
                onClick={() => setPage(data.meta.page + 1)}
                disabled={data.meta.page >= data.meta.totalPages}
                className="rounded-md border px-3 py-1.5 text-sm disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      <ConfirmModal
        open={deleteTarget !== null}
        title="Delete Review"
        message="Are you sure you want to delete this review? This action cannot be undone."
        variant="danger"
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
    <div className="rounded-lg border bg-white p-4">
      <div className="flex gap-4">
        <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border bg-gray-100">
          {review.product_thumbnail_url ? (
            <img
              src={review.product_thumbnail_url}
              alt={review.product_name || ''}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Package className="h-6 w-6 text-gray-400" />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-gray-900">
                {review.product_name || `Product #${review.product_id}`}
              </p>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <div className="flex">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-3.5 w-3.5 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`}
                    />
                  ))}
                </div>
                <span className="text-xs text-gray-500">{formatDate(review.created_at)}</span>
                {(review.variant_option1 || review.variant_option2) && (
                  <span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-500">
                    {[review.variant_option1, review.variant_option2].filter(Boolean).join(', ')}
                  </span>
                )}
              </div>
            </div>

            <button
              onClick={() => onDelete(review.id)}
              disabled={isDeleting}
              className="flex-shrink-0 rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500 disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>

          {review.comment && (
            <p className="mt-2 text-sm text-gray-700">{review.comment}</p>
          )}
        </div>
      </div>
    </div>
  );
}
