import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Star, Loader2 } from 'lucide-react';
import { useCreateReview } from '../hooks/useCreateReview';
import { reviewSchema, type ReviewFormData } from '../types/review.types';

interface Props {
  productId: number;
  orderId: number;
  onSuccess?: () => void;
}

export function ReviewForm({ productId, orderId, onSuccess }: Props) {
  const [hoverRating, setHoverRating] = useState(0);
  const createReview = useCreateReview();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ReviewFormData>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      product_id: productId,
      order_id: orderId,
      rating: 0,
      comment: '',
    },
  });

  const currentRating = watch('rating');

  function onSubmit(data: ReviewFormData) {
    createReview.mutate(data, {
      onSuccess: () => onSuccess?.(),
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Rating</label>
        <div className="flex gap-1">
          {Array.from({ length: 5 }).map((_, i) => {
            const starValue = i + 1;
            return (
              <button
                key={i}
                type="button"
                onMouseEnter={() => setHoverRating(starValue)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => setValue('rating', starValue, { shouldValidate: true })}
                className="p-0.5"
              >
                <Star
                  className={`h-6 w-6 transition-colors ${
                    starValue <= (hoverRating || currentRating)
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-gray-300'
                  }`}
                />
              </button>
            );
          })}
        </div>
        {errors.rating && (
          <p className="mt-1 text-xs text-red-500">{errors.rating.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="comment" className="mb-1 block text-sm font-medium text-gray-700">
          Comment (optional)
        </label>
        <textarea
          id="comment"
          {...register('comment')}
          rows={3}
          placeholder="Share your experience with this product..."
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none"
        />
        {errors.comment && (
          <p className="mt-1 text-xs text-red-500">{errors.comment.message}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={createReview.isPending}
        className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {createReview.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
        Submit Review
      </button>
    </form>
  );
}
