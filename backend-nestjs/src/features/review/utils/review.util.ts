import { Review } from '../entities/review.entity';
import {
  ReviewResponseDto,
  ReviewWithUserResponseDto,
  MyReviewResponseDto,
  AdminReviewResponseDto,
} from '../dto/review-response.dto';

interface VariantInfo {
  option1: string | null;
  option2: string | null;
}

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
  variantInfo?: VariantInfo,
): ReviewWithUserResponseDto {
  return {
    ...toReviewResponse(review),
    user_full_name: review.user?.full_name ?? '',
    variant_option1: variantInfo?.option1 ?? null,
    variant_option2: variantInfo?.option2 ?? null,
  };
}

export function toMyReviewResponse(
  review: Review,
  variantInfo?: VariantInfo,
): MyReviewResponseDto {
  return {
    ...toReviewResponse(review),
    product_name: review.product?.name,
    product_thumbnail_url: review.product?.thumbnail_url ?? null,
    variant_option1: variantInfo?.option1 ?? null,
    variant_option2: variantInfo?.option2 ?? null,
  };
}

export function toAdminReviewResponse(
  review: Review,
  variantInfo?: VariantInfo,
): AdminReviewResponseDto {
  return {
    ...toReviewResponse(review),
    user_id: review.user_id,
    user_email: review.user?.email,
    user_full_name: review.user?.full_name,
    product_name: review.product?.name,
    product_thumbnail_url: review.product?.thumbnail_url ?? null,
    variant_option1: variantInfo?.option1 ?? null,
    variant_option2: variantInfo?.option2 ?? null,
  };
}
