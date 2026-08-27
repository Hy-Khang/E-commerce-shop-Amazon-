import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { usePagination } from '@/common/hooks/usePagination';
import { ConfirmModal } from '@/common/components/ui/ConfirmModal';
import { useAdminReviews } from '../hooks/useAdminReviews';
import { useAdminDeleteReview } from '../hooks/useAdminDeleteReview';
import { ReviewFilters } from '../components/ReviewFilters';
import { ReviewsTable } from '../components/ReviewsTable';
import type { AdminReviewListParams } from '../types/review.types';

export default function AdminReviewListPage() {
  const [searchParams] = useSearchParams();
  const { params, setPage } = usePagination({ limit: 20, sort: 'created_at', order: 'desc' });

  const filters: AdminReviewListParams = {
    ...params,
    product_id: searchParams.get('product_id') ? Number(searchParams.get('product_id')) : undefined,
    user_id: searchParams.get('user_id') ? Number(searchParams.get('user_id')) : undefined,
    rating: searchParams.get('rating') ? Number(searchParams.get('rating')) : undefined,
    category_id: searchParams.get('category_id') ? Number(searchParams.get('category_id')) : undefined,
  };

  const { data, isLoading } = useAdminReviews(filters);
  const deleteReview = useAdminDeleteReview();
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);

  function confirmDelete() {
    if (deleteTarget !== null) {
      deleteReview.mutate(deleteTarget);
      setDeleteTarget(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Reviews</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Moderate customer reviews</p>
      </div>

      <ReviewFilters />

      <ReviewsTable
        data={data?.data}
        isLoading={isLoading}
        meta={data?.meta}
        onPageChange={setPage}
        onDelete={(id) => setDeleteTarget(id)}
        isDeleting={deleteReview.isPending}
      />

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
