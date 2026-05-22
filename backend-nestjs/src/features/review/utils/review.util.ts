import { Review } from '../entities/review.entity';
import {
  ReviewResponseDto,
  ReviewWithUserResponseDto,
  MyReviewResponseDto,
  AdminReviewResponseDto,
} from '../dto/review-response.dto';

export function toReviewResponse(review: Review): ReviewResponseDto {
  return {
    id: review.id,
    product_id: review.product_id,
    order_id: review.order_id,
    rating: review.rating,
    comment: review.comment,
    created_at: review.created_at,
  };
}

export function toReviewWithUserResponse(
  review: Review,
  variantInfo?: { color: string | null; size: string | null },
): ReviewWithUserResponseDto {
  return {
    ...toReviewResponse(review),
    user_full_name: review.user?.full_name ?? '',
    variant_color: variantInfo?.color ?? null,
    variant_size: variantInfo?.size ?? null,
  };
}

export function toMyReviewResponse(
  review: Review,
  variantInfo?: { color: string | null; size: string | null },
): MyReviewResponseDto {
  return {
    ...toReviewResponse(review),
    product_name: review.product?.name,
    product_thumbnail_url: review.product?.thumbnail_url ?? null,
    variant_color: variantInfo?.color ?? null,
    variant_size: variantInfo?.size ?? null,
  };
}

export function toAdminReviewResponse(
  review: Review,
  variantInfo?: { color: string | null; size: string | null },
): AdminReviewResponseDto {
  return {
    ...toReviewResponse(review),
    user_id: review.user_id,
    user_email: review.user?.email,
    user_full_name: review.user?.full_name,
    product_name: review.product?.name,
    product_thumbnail_url: review.product?.thumbnail_url ?? null,
    variant_color: variantInfo?.color ?? null,
    variant_size: variantInfo?.size ?? null,
  };
}
