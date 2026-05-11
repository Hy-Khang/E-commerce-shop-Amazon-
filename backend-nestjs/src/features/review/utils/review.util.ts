import { Review } from '../entities/review.entity';
import {
  ReviewResponseDto,
  ReviewWithUserResponseDto,
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
): ReviewWithUserResponseDto {
  return {
    ...toReviewResponse(review),
    user_full_name: review.user?.full_name ?? '',
  };
}

export function toAdminReviewResponse(
  review: Review,
): AdminReviewResponseDto {
  return {
    ...toReviewResponse(review),
    user_id: review.user_id,
    user_email: review.user?.email,
    user_full_name: review.user?.full_name,
    product_name: review.product?.name,
  };
}
