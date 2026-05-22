import {
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ReviewRepository } from './repositories/review.repository';
import { OrderService } from '../order/order.service';
import { ProductService } from '../product/product.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { ReviewQueryDto } from './dto/review-query.dto';
import {
  ReviewResponseDto,
  ReviewWithUserResponseDto,
  ReviewStatsDto,
  MyReviewResponseDto,
  AdminReviewResponseDto,
} from './dto/review-response.dto';
import {
  toReviewResponse,
  toReviewWithUserResponse,
  toMyReviewResponse,
  toAdminReviewResponse,
} from './utils/review.util';
import { OrderStatus } from '../../common/constants';
import { IPaginatedResult } from '../../common/interfaces/paginated-result.interface';

@Injectable()
export class ReviewService {
  private readonly logger = new Logger(ReviewService.name);

  constructor(
    private readonly reviewRepository: ReviewRepository,
    private readonly orderService: OrderService,
    private readonly productService: ProductService,
  ) {}

  // ─── Customer endpoints ───

  async createReview(
    userId: number,
    dto: CreateReviewDto,
  ): Promise<ReviewResponseDto> {
    const order = await this.orderService.findOrderByIdForReview(dto.order_id);
    if (!order) {
      throw new NotFoundException({
        code: 'ORDER_001',
        message: 'Order not found',
      });
    }

    if (order.user_id !== userId) {
      throw new ForbiddenException({
        code: 'ORDER_004',
        message: 'Order does not belong to user',
      });
    }

    if (order.status !== OrderStatus.Delivered) {
      throw new ForbiddenException({
        code: 'REVIEW_001',
        message: 'Can only review products from delivered orders',
      });
    }

    const variantIds = (order.order_items ?? [])
      .filter((item) => item.product_variant_id != null)
      .map((item) => item.product_variant_id);

    let productFoundInOrder = false;
    for (const variantId of variantIds) {
      const variant = await this.productService.findVariantById(variantId);
      if (variant && variant.product_id === dto.product_id) {
        productFoundInOrder = true;
        break;
      }
    }

    if (!productFoundInOrder) {
      throw new ForbiddenException({
        code: 'REVIEW_001',
        message: 'Product not purchased in this order',
      });
    }

    const existingReview =
      await this.reviewRepository.findByUserAndOrderAndProduct(
        userId,
        dto.order_id,
        dto.product_id,
      );
    if (existingReview) {
      throw new ConflictException({
        code: 'REVIEW_002',
        message: 'Review already exists for this order and product',
      });
    }

    const review = await this.reviewRepository.create({
      user_id: userId,
      product_id: dto.product_id,
      order_id: dto.order_id,
      rating: dto.rating,
      comment: dto.comment ?? null,
    });

    this.logger.log(
      `Review created by user ${userId} for product ${dto.product_id}, rating: ${dto.rating}`,
    );

    return toReviewResponse(review);
  }

  async findProductReviews(
    productId: number,
    query: ReviewQueryDto,
  ): Promise<
    IPaginatedResult<ReviewWithUserResponseDto> & { stats: ReviewStatsDto }
  > {
    const result = await this.reviewRepository.findByProductIdPaginated(
      productId,
      query.page || 1,
      query.limit || 20,
      query.sort,
      query.order,
    );

    const pairs = result.data.map((r) => ({
      order_id: r.order_id,
      product_id: r.product_id,
    }));

    const [variantMap, stats] = await Promise.all([
      this.reviewRepository.findVariantInfoForReviews(pairs),
      this.reviewRepository.getReviewStats(productId),
    ]);

    return {
      data: result.data.map((review) =>
        toReviewWithUserResponse(
          review,
          variantMap.get(`${review.order_id}-${review.product_id}`),
        ),
      ),
      meta: result.meta,
      stats,
    };
  }

  async findMyReviews(
    userId: number,
    query: ReviewQueryDto,
  ): Promise<IPaginatedResult<MyReviewResponseDto>> {
    const result = await this.reviewRepository.findByUserIdPaginated(
      userId,
      query.page || 1,
      query.limit || 20,
      query.sort,
      query.order,
    );

    const variantMap = await this.reviewRepository.findVariantInfoForReviews(
      result.data.map((r) => ({
        order_id: r.order_id,
        product_id: r.product_id,
      })),
    );

    return {
      data: result.data.map((review) =>
        toMyReviewResponse(
          review,
          variantMap.get(`${review.order_id}-${review.product_id}`),
        ),
      ),
      meta: result.meta,
    };
  }

  async deleteMyReview(userId: number, reviewId: number): Promise<void> {
    const review = await this.reviewRepository.findById(reviewId);
    if (!review) {
      throw new NotFoundException({
        code: 'COMMON_001',
        message: 'Review not found',
      });
    }

    if (review.user_id !== userId) {
      throw new ForbiddenException({
        code: 'ORDER_004',
        message: 'Review does not belong to user',
      });
    }

    await this.reviewRepository.delete(reviewId);
    this.logger.log(`Review ${reviewId} deleted by user ${userId}`);
  }

  // ─── Admin endpoints ───

  async findAllReviews(
    query: ReviewQueryDto,
  ): Promise<IPaginatedResult<AdminReviewResponseDto>> {
    const result = await this.reviewRepository.findAllPaginated(query);

    const variantMap = await this.reviewRepository.findVariantInfoForReviews(
      result.data.map((r) => ({
        order_id: r.order_id,
        product_id: r.product_id,
      })),
    );

    return {
      data: result.data.map((review) =>
        toAdminReviewResponse(
          review,
          variantMap.get(`${review.order_id}-${review.product_id}`),
        ),
      ),
      meta: result.meta,
    };
  }

  async deleteReview(reviewId: number): Promise<void> {
    const review = await this.reviewRepository.findById(reviewId);
    if (!review) {
      throw new NotFoundException({
        code: 'COMMON_001',
        message: 'Review not found',
      });
    }

    await this.reviewRepository.delete(reviewId);
    this.logger.log(`Review ${reviewId} deleted by admin`);
  }
}
