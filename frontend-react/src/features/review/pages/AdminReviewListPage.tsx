import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Star, ChevronDown, ChevronUp, Package } from 'lucide-react';
import { usePagination } from '@/common/hooks/usePagination';
import { formatDate } from '@/common/utils/format.util';
import { useAdminReviews } from '../hooks/useAdminReviews';
import { useAdminDeleteReview } from '../hooks/useAdminDeleteReview';
import type { Review, AdminReviewListParams } from '../types/review.types';

const RATING_OPTIONS = [1, 2, 3, 4, 5];

export default function AdminReviewListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { params, setPage } = usePagination({ limit: 20, sort: 'created_at', order: 'desc' });
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const filters: AdminReviewListParams = {
    ...params,
    product_id: searchParams.get('product_id') ? Number(searchParams.get('product_id')) : undefined,
    user_id: searchParams.get('user_id') ? Number(searchParams.get('user_id')) : undefined,
    rating: searchParams.get('rating') ? Number(searchParams.get('rating')) : undefined,
  };

  const { data, isLoading } = useAdminReviews(filters);
  const deleteReview = useAdminDeleteReview();

  function handleFilterChange(key: string, value: string) {
    setSearchParams((prev) => {
      if (value) prev.set(key, value);
      else prev.delete(key);
      prev.set('page', '1');
      return prev;
    });
  }

  function handleDelete(id: number) {
    if (window.confirm('Are you sure you want to delete this review?')) {
      deleteReview.mutate(id);
    }
  }

  function toggleExpand(id: number) {
    setExpandedId((prev) => (prev === id ? null : id));
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Reviews</h1>

      <div className="flex flex-wrap gap-3">
        <select
          value={searchParams.get('rating') || ''}
          onChange={(e) => handleFilterChange('rating', e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
        >
          <option value="">All Ratings</option>
          {RATING_OPTIONS.map((r) => (
            <option key={r} value={r}>{r} Star{r > 1 ? 's' : ''}</option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="w-8 px-4 py-3" />
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">ID</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Product</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Rating</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Comment</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">User</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Date</th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 8 }).map((__, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-4 animate-pulse rounded bg-gray-200" />
                    </td>
                  ))}
                </tr>
              ))
            ) : data && data.data.length > 0 ? (
              data.data.map((review) => (
                <ReviewRow
                  key={review.id}
                  review={review}
                  isExpanded={expandedId === review.id}
                  onToggle={() => toggleExpand(review.id)}
                  onDelete={() => handleDelete(review.id)}
                  isDeleting={deleteReview.isPending}
                />
              ))
            ) : (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-sm text-gray-500">
                  No reviews found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {data && data.meta.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
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
    </div>
  );
}

interface ReviewRowProps {
  review: Review;
  isExpanded: boolean;
  onToggle: () => void;
  onDelete: () => void;
  isDeleting: boolean;
}

function ReviewRow({ review, isExpanded, onToggle, onDelete, isDeleting }: ReviewRowProps) {
  return (
    <>
      <tr className="hover:bg-gray-50">
        <td className="px-4 py-3">
          <button onClick={onToggle} className="text-gray-400 hover:text-gray-600">
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </td>
        <td className="px-4 py-3 text-sm text-gray-900">#{review.id}</td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 flex-shrink-0 overflow-hidden rounded border bg-gray-100">
              {review.product_thumbnail_url ? (
                <img src={review.product_thumbnail_url} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <Package className="h-4 w-4 text-gray-400" />
                </div>
              )}
            </div>
            <span className="max-w-[150px] truncate text-sm text-gray-900">
              {review.product_name || `#${review.product_id}`}
            </span>
          </div>
        </td>
        <td className="px-4 py-3">
          <div className="flex">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`h-3.5 w-3.5 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`}
              />
            ))}
          </div>
          {(review.variant_color || review.variant_size) && (
            <span className="mt-1 inline-block rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-500">
              {[review.variant_color, review.variant_size].filter(Boolean).join(', ')}
            </span>
          )}
        </td>
        <td className="max-w-xs px-4 py-3 text-sm text-gray-600">
          <p className="truncate">{review.comment || '—'}</p>
        </td>
        <td className="px-4 py-3 text-sm text-gray-600">
          {review.user_full_name || `User #${review.user_id}`}
        </td>
        <td className="px-4 py-3 text-sm text-gray-600">{formatDate(review.created_at)}</td>
        <td className="px-4 py-3 text-right">
          <button
            onClick={onDelete}
            disabled={isDeleting}
            className="text-sm font-medium text-red-600 hover:text-red-800 disabled:opacity-50"
          >
            Delete
          </button>
        </td>
      </tr>

      {isExpanded && (
        <tr>
          <td colSpan={8} className="bg-gray-50 px-6 py-4">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <div className="flex gap-3">
                  <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-md border bg-white">
                    {review.product_thumbnail_url ? (
                      <img src={review.product_thumbnail_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <Package className="h-8 w-8 text-gray-300" />
                      </div>
                    )}
                  </div>
                  <dl className="space-y-1 text-sm">
                    <h4 className="mb-3 text-sm font-semibold text-gray-900">Product Info</h4>
                    <div>
                      <dt className="text-gray-500">Product ID</dt>
                      <dd className="text-gray-900">#{review.product_id}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">Name</dt>
                      <dd className="font-medium text-gray-900">{review.product_name || '—'}</dd>
                    </div>
                    {(review.variant_color || review.variant_size) && (
                      <div>
                        <dt className="text-gray-500">Variant</dt>
                        <dd className="text-gray-900">
                          {[review.variant_color, review.variant_size].filter(Boolean).join(', ')}
                        </dd>
                      </div>
                    )}
                  </dl>
                </div>
              </div>

              <div>
                <h4 className="mb-3 text-sm font-semibold text-gray-900">User Info</h4>
                <dl className="space-y-1 text-sm">
                  <div>
                    <dt className="text-gray-500">User ID</dt>
                    <dd className="text-gray-900">#{review.user_id}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Name</dt>
                    <dd className="font-medium text-gray-900">{review.user_full_name || '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Email</dt>
                    <dd className="text-gray-900">{review.user_email || '—'}</dd>
                  </div>
                </dl>
              </div>
              <div className="border-t border-gray-500 md:col-span-2" />
              <div className="md:col-span-2">
                <h4 className="mb-2 text-sm font-semibold text-gray-900">Full Comment</h4>
                <p className="whitespace-pre-wrap text-sm text-gray-700">
                  {review.comment || 'No comment provided.'}
                </p>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
