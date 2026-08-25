import { z } from 'zod';
import type { PaginationParams } from '@/common/types/common.types';

// --- Response types ---

export interface Review {
  id: number;
  product_id: number;
  order_id: number;
  rating: number;
  comment: string | null;
  created_at: string;
  // Product reviews + admin reviews
  user_full_name?: string;
  // Product reviews — variant classification
  variant_option1?: string | null;
  variant_option2?: string | null;
  // My reviews + admin reviews
  product_name?: string;
  product_thumbnail_url?: string | null;
  // Admin reviews only
  user_id?: number;
  user_email?: string;
}

export interface ReviewStats {
  average_rating: number;
  total_reviews: number;
  rating_distribution: Record<number, number>;
}

// --- Query params ---

export interface ProductReviewListParams extends PaginationParams {
  product_id?: number;
  rating?: number;
}

export type MyReviewListParams = PaginationParams;

export interface AdminReviewListParams extends PaginationParams {
  product_id?: number;
  user_id?: number;
  rating?: number;
  category_id?: number;
}

export interface SellerReviewListParams extends PaginationParams {
  product_id?: number;
  rating?: number;
  category_id?: number;
}

// --- Request types ---

export interface CreateReviewRequest {
  product_id: number;
  order_id: number;
  rating: number;
  comment?: string;
}

// --- Zod schemas (forms) ---

export const reviewSchema = z.object({
  product_id: z.number().int().positive(),
  order_id: z.number().int().positive(),
  rating: z.number().int().min(1, 'Rating must be at least 1').max(5, 'Rating must be at most 5'),
  comment: z.string().max(2000, 'Comment must be under 2000 characters').optional(),
});

export type ReviewFormData = z.infer<typeof reviewSchema>;
