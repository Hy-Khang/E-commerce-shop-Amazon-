import { useSearchParams } from 'react-router-dom';
import { usePagination } from '@/common/hooks/usePagination';
import { useSellerReviews } from '../hooks/useSellerReviews';
import { ReviewFilters } from '../components/ReviewFilters';
import { ReviewsTable } from '../components/ReviewsTable';
import type { SellerReviewListParams } from '../types/review.types';

export default function SellerReviewListPage() {
  const [searchParams] = useSearchParams();
  const { params, setPage } = usePagination({ limit: 20, sort: 'created_at', order: 'desc' });

  const filters: SellerReviewListParams = {
    ...params,
    product_id: searchParams.get('product_id') ? Number(searchParams.get('product_id')) : undefined,
    rating: searchParams.get('rating') ? Number(searchParams.get('rating')) : undefined,
    category_id: searchParams.get('category_id') ? Number(searchParams.get('category_id')) : undefined,
  };

  const { data, isLoading } = useSellerReviews(filters);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Reviews</h1>
        <p className="mt-1 text-sm text-slate-500">Customer reviews for your shop's products</p>
      </div>

      <ReviewFilters />

      <ReviewsTable
        data={data?.data}
        isLoading={isLoading}
        meta={data?.meta}
        onPageChange={setPage}
      />
    </div>
  );
}
