import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { WishlistItemRepository } from './repositories/wishlist-item.repository';
import { ProductService } from '../product/product.service';
import { AddWishlistItemDto } from './dto/add-wishlist-item.dto';
import { BulkCheckWishlistDto } from './dto/bulk-check-wishlist.dto';
import { WishlistQueryDto } from './dto/wishlist-query.dto';
import {
  WishlistItemResponseDto,
  WishlistCheckResponseDto,
  BulkCheckResponseDto,
  PopularWishlistItemDto,
} from './dto/wishlist-response.dto';
import { toWishlistItemResponse } from './utils/wishlist.util';
import { IPaginatedResult } from '../../common/interfaces/paginated-result.interface';

@Injectable()
export class WishlistService {
  private readonly logger = new Logger(WishlistService.name);

  constructor(
    private readonly wishlistItemRepository: WishlistItemRepository,
    private readonly productService: ProductService,
  ) {}

  // ─── Customer endpoints ───

  async addToWishlist(
    userId: number,
    dto: AddWishlistItemDto,
  ): Promise<WishlistItemResponseDto> {
    const product = await this.productService.findProductByIdPublic(
      dto.product_id,
    );
    if (!product || !product.is_active) {
      throw new NotFoundException({
        code: 'WISHLIST_003',
        message: 'Product not found or inactive',
      });
    }

    const existing = await this.wishlistItemRepository.findByUserAndProduct(
      userId,
      dto.product_id,
    );
    if (existing) {
      throw new ConflictException({
        code: 'WISHLIST_001',
        message: 'Product already in wishlist',
      });
    }

    const item = await this.wishlistItemRepository.create({
      user_id: userId,
      product_id: dto.product_id,
    });
    item.product = product;

    const priceMap = await this.wishlistItemRepository.findPriceRanges([
      dto.product_id,
    ]);

    this.logger.log(
      `User ${userId} added product ${dto.product_id} to wishlist`,
    );

    return toWishlistItemResponse(item, priceMap.get(dto.product_id));
  }

  async removeFromWishlist(
    userId: number,
    productId: number,
  ): Promise<void> {
    const deleted = await this.wishlistItemRepository.deleteByUserAndProduct(
      userId,
      productId,
    );
    if (!deleted) {
      throw new NotFoundException({
        code: 'WISHLIST_002',
        message: 'Product not in wishlist',
      });
    }

    this.logger.log(
      `User ${userId} removed product ${productId} from wishlist`,
    );
  }

  async getMyWishlist(
    userId: number,
    query: WishlistQueryDto,
  ): Promise<IPaginatedResult<WishlistItemResponseDto>> {
    const result = await this.wishlistItemRepository.findByUserIdPaginated(
      userId,
      query.page || 1,
      query.limit || 20,
      query.sort,
      query.order,
    );

    const productIds = result.data.map((item) => item.product_id);
    const priceMap =
      await this.wishlistItemRepository.findPriceRanges(productIds);

    return {
      data: result.data.map((item) =>
        toWishlistItemResponse(item, priceMap.get(item.product_id)),
      ),
      meta: result.meta,
    };
  }

  async checkInWishlist(
    userId: number,
    productId: number,
  ): Promise<WishlistCheckResponseDto> {
    const item = await this.wishlistItemRepository.findByUserAndProduct(
      userId,
      productId,
    );
    return { in_wishlist: !!item };
  }

  async bulkCheckInWishlist(
    userId: number,
    dto: BulkCheckWishlistDto,
  ): Promise<BulkCheckResponseDto> {
    const items = await this.wishlistItemRepository.findByUserAndProductIds(
      userId,
      dto.product_ids,
    );

    const wishlistedSet = new Set(items.map((item) => item.product_id));
    const result: Record<number, boolean> = {};
    for (const id of dto.product_ids) {
      result[id] = wishlistedSet.has(id);
    }

    return { items: result };
  }

  // ─── Admin endpoints ───

  async getMostWishlisted(
    page: number,
    limit: number,
  ): Promise<IPaginatedResult<PopularWishlistItemDto>> {
    return this.wishlistItemRepository.findMostWishlistedPaginated(page, limit);
  }
}
