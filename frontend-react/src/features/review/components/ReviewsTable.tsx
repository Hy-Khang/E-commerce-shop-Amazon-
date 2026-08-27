import { useState } from 'react';
import { Star, ChevronDown, ChevronUp, Package, Trash2, MessageSquare } from 'lucide-react';
import { formatDate, getImageUrl } from '@/common/utils/format.util';
import { Button } from '@/common/components/ui/Button';
import { getPageRange } from '@/common/utils/pagination.util';
import type { PaginationMeta } from '@/core/api/api.types';
import type { Review } from '../types/review.types';

interface ReviewsTableProps {
  data: Review[] | undefined;
  isLoading: boolean;
  meta?: PaginationMeta;
  onPageChange: (page: number) => void;
  /** When provided, renders a delete action per row (admin moderation). */
  onDelete?: (id: number) => void;
  isDeleting?: boolean;
}

export function ReviewsTable({ data, isLoading, meta, onPageChange, onDelete, isDeleting = false }: ReviewsTableProps) {
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const showActions = !!onDelete;
  const colSpan = showActions ? 8 : 7;

  return (
    <div className="admin-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="admin-table-header">
              <th className="w-8 px-4 py-3.5" />
              <th className="px-6 py-3.5 text-left">ID</th>
              <th className="px-6 py-3.5 text-left">Product</th>
              <th className="px-6 py-3.5 text-left">Rating</th>
              <th className="px-6 py-3.5 text-left">Comment</th>
              <th className="px-6 py-3.5 text-left">User</th>
              <th className="px-6 py-3.5 text-left">Date</th>
              {showActions && <th className="px-6 py-3.5 text-right">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: colSpan }).map((__, j) => (
                    <td key={j} className="px-6 py-4">
                      <div className="h-4 w-3/4 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
                    </td>
                  ))}
                </tr>
              ))
            ) : data && data.length > 0 ? (
              data.map((review) => (
                <ReviewRow
                  key={review.id}
                  review={review}
                  isExpanded={expandedId === review.id}
                  onToggle={() => setExpandedId((prev) => (prev === review.id ? null : review.id))}
                  onDelete={onDelete ? () => onDelete(review.id) : undefined}
                  isDeleting={isDeleting}
                  colSpan={colSpan}
                />
              ))
            ) : (
              <tr>
                <td colSpan={colSpan} className="py-16 text-center">
                  <MessageSquare className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-600" />
                  <p className="mt-4 text-sm font-semibold text-slate-900 dark:text-slate-100">No reviews found</p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Try adjusting your filters.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {meta && meta.totalPages > 1 && (
        <ReviewPagination meta={meta} onPageChange={onPageChange} />
      )}
    </div>
  );
}

function ReviewPagination({ meta, onPageChange }: { meta: PaginationMeta; onPageChange: (page: number) => void }) {
  const pages = getPageRange(meta.page, meta.totalPages);

  return (
    <div className="flex items-center justify-between border-t border-slate-100 px-6 py-3.5 dark:border-slate-800">
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Showing <span className="font-medium text-slate-700 dark:text-slate-300">{(meta.page - 1) * meta.limit + 1}</span>–<span className="font-medium text-slate-700 dark:text-slate-300">{Math.min(meta.page * meta.limit, meta.total)}</span> of <span className="font-medium text-slate-700 dark:text-slate-300">{meta.total}</span>
      </p>
      <div className="flex items-center gap-1">
        {pages.map((p, i) =>
          p === '...' ? (
            <span key={`e-${i}`} className="px-1 text-sm text-slate-400 dark:text-slate-500">...</span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={`min-w-[32px] rounded-lg px-2 py-1.5 text-sm font-medium transition-colors ${
                p === meta.page ? 'bg-teal-600 text-white' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
              }`}
            >
              {p}
            </button>
          ),
        )}
      </div>
    </div>
  );
}

interface ReviewRowProps {
  review: Review;
  isExpanded: boolean;
  onToggle: () => void;
  onDelete?: () => void;
  isDeleting: boolean;
  colSpan: number;
}

function ReviewRow({ review, isExpanded, onToggle, onDelete, isDeleting, colSpan }: ReviewRowProps) {
  return (
    <>
      <tr className="hover:bg-slate-50/50 transition-colors dark:hover:bg-slate-800/50">
        <td className="px-4 py-4">
          <button onClick={onToggle} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-300">
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </td>
        <td className="px-6 py-4 font-mono text-sm text-slate-500 dark:text-slate-400">#{review.id}</td>
        <td className="px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 flex-shrink-0 overflow-hidden rounded-lg ring-1 ring-slate-900/5 dark:ring-white/10">
              {review.product_thumbnail_url ? (
                <img src={getImageUrl(review.product_thumbnail_url)} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-slate-100 dark:bg-slate-800">
                  <Package className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                </div>
              )}
            </div>
            <span className="max-w-[150px] truncate text-sm text-slate-900 dark:text-slate-100">
              {review.product_name || `#${review.product_id}`}
            </span>
          </div>
        </td>
        <td className="px-6 py-4">
          <div className="flex">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`h-3.5 w-3.5 ${i < review.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200 dark:text-slate-600'}`}
              />
            ))}
          </div>
          {(review.variant_option1 || review.variant_option2) && (
            <span className="mt-1 inline-block rounded-md bg-slate-100 px-1.5 py-0.5 text-xs text-slate-500 dark:bg-slate-800 dark:text-slate-400">
              {[review.variant_option1, review.variant_option2].filter(Boolean).join(', ')}
            </span>
          )}
        </td>
        <td className="max-w-xs px-6 py-4 text-sm text-slate-600 dark:text-slate-300">
          <p className="truncate">{review.comment || '—'}</p>
        </td>
        <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">
          {review.user_full_name || `User #${review.user_id}`}
        </td>
        <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">{formatDate(review.created_at)}</td>
        {onDelete && (
          <td className="px-6 py-4 text-right">
            <Button
              variant="ghost"
              iconOnly
              icon={Trash2}
              aria-label="Delete review"
              onClick={onDelete}
              disabled={isDeleting}
              className="hover:!text-rose-600"
            />
          </td>
        )}
      </tr>

      {isExpanded && (
        <tr>
          <td colSpan={colSpan} className="bg-slate-50/50 px-8 py-6 dark:bg-slate-800/30">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <div className="flex gap-3">
                  <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl ring-1 ring-slate-900/5 dark:ring-white/10">
                    {review.product_thumbnail_url ? (
                      <img src={getImageUrl(review.product_thumbnail_url)} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-slate-100 dark:bg-slate-800">
                        <Package className="h-8 w-8 text-slate-300 dark:text-slate-600" />
                      </div>
                    )}
                  </div>
                  <dl className="space-y-1 text-sm">
                    <h4 className="mb-3 text-sm font-semibold text-slate-900 dark:text-slate-100">Product Info</h4>
                    <div>
                      <dt className="text-slate-500 dark:text-slate-400">Product ID</dt>
                      <dd className="text-slate-900 dark:text-slate-100">#{review.product_id}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-500 dark:text-slate-400">Name</dt>
                      <dd className="font-medium text-slate-900 dark:text-slate-100">{review.product_name || '—'}</dd>
                    </div>
                    {(review.variant_option1 || review.variant_option2) && (
                      <div>
                        <dt className="text-slate-500 dark:text-slate-400">Variant</dt>
                        <dd className="text-slate-900 dark:text-slate-100">
                          {[review.variant_option1, review.variant_option2].filter(Boolean).join(', ')}
                        </dd>
                      </div>
                    )}
                  </dl>
                </div>
              </div>

              <div>
                <h4 className="mb-3 text-sm font-semibold text-slate-900 dark:text-slate-100">User Info</h4>
                <dl className="space-y-1 text-sm">
                  <div>
                    <dt className="text-slate-500 dark:text-slate-400">User ID</dt>
                    <dd className="text-slate-900 dark:text-slate-100">#{review.user_id}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-500 dark:text-slate-400">Name</dt>
                    <dd className="font-medium text-slate-900 dark:text-slate-100">{review.user_full_name || '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-500 dark:text-slate-400">Email</dt>
                    <dd className="text-slate-900 dark:text-slate-100">{review.user_email || '—'}</dd>
                  </div>
                </dl>
              </div>
              <div className="border-t border-slate-200 md:col-span-2 dark:border-slate-800" />
              <div className="md:col-span-2">
                <h4 className="mb-2 text-sm font-semibold text-slate-900 dark:text-slate-100">Full Comment</h4>
                <p className="whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-300">
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
