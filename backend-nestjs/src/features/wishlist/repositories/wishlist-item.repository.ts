import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { WishlistItem } from '../entities/wishlist-item.entity';
import { IPaginatedResult } from '../../../common/interfaces/paginated-result.interface';
import { PopularWishlistItemDto } from '../dto/wishlist-response.dto';

@Injectable()
export class WishlistItemRepository {
  constructor(
    @InjectRepository(WishlistItem)
    private readonly repo: Repository<WishlistItem>,
  ) {}

  async findByUserAndProduct(
    userId: number,
    productId: number,
  ): Promise<WishlistItem | null> {
    return this.repo.findOne({
      where: { user_id: userId, product_id: productId },
    });
  }

  async findByUserAndProductIds(
    userId: number,
    productIds: number[],
  ): Promise<WishlistItem[]> {
    if (productIds.length === 0) return [];

    return this.repo.find({
      where: { user_id: userId, product_id: In(productIds) },
      select: ['product_id'],
    });
  }

  async findByUserIdPaginated(
    userId: number,
    page: number,
    limit: number,
    sort = 'created_at',
    order: 'asc' | 'desc' = 'desc',
  ): Promise<IPaginatedResult<WishlistItem>> {
    const [data, total] = await this.repo.findAndCount({
      where: { user_id: userId },
      relations: ['product'],
      order: { [sort]: order.toUpperCase() },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findPriceRanges(
    productIds: number[],
  ): Promise<
    Map<number, { min_price: number | null; min_sale_price: number | null }>
  > {
    if (productIds.length === 0) return new Map();

    const results = await this.repo.manager
      .createQueryBuilder()
      .select('pv.product_id', 'product_id')
      .addSelect('MIN(pv.price)', 'min_price')
      .addSelect('MIN(pv.sale_price)', 'min_sale_price')
      .from('product_variants', 'pv')
      .where('pv.product_id IN (:...productIds)', { productIds })
      .groupBy('pv.product_id')
      .getRawMany();

    const map = new Map<
      number,
      { min_price: number | null; min_sale_price: number | null }
    >();
    for (const row of results) {
      map.set(row.product_id, {
        min_price: row.min_price != null ? parseFloat(row.min_price) : null,
        min_sale_price:
          row.min_sale_price != null ? parseFloat(row.min_sale_price) : null,
      });
    }
    return map;
  }

  async findMostWishlistedPaginated(
    page: number,
    limit: number,
    shopId?: number,
  ): Promise<IPaginatedResult<PopularWishlistItemDto>> {
    const qb = this.repo
      .createQueryBuilder('wi')
      .innerJoin('wi.product', 'product')
      .select('product.id', 'product_id')
      .addSelect('product.name', 'product_name')
      .addSelect('product.slug', 'product_slug')
      .addSelect('product.thumbnail_url', 'product_thumbnail_url')
      .addSelect('product.is_active', 'product_is_active')
      .addSelect('COUNT(*)', 'wishlist_count')
      .groupBy('product.id')
      .addGroupBy('product.name')
      .addGroupBy('product.slug')
      .addGroupBy('product.thumbnail_url')
      .addGroupBy('product.is_active')
      .orderBy('wishlist_count', 'DESC')
      .offset((page - 1) * limit)
      .limit(limit);

    if (shopId) {
      qb.where('product.shop_id = :shopId', { shopId });
    }

    const data = await qb.getRawMany();

    const countQb = this.repo
      .createQueryBuilder('wi')
      .innerJoin('wi.product', 'product')
      .select('product.id')
      .groupBy('product.id');
    if (shopId) {
      countQb.where('product.shop_id = :shopId', { shopId });
    }
    const totalResult = await countQb.getRawMany();
    const total = totalResult.length;

    return {
      data: data.map((row) => ({
        product_id: row.product_id,
        product_name: row.product_name,
        product_slug: row.product_slug,
        product_thumbnail_url: row.product_thumbnail_url ?? null,
        product_is_active: row.product_is_active ?? false,
        wishlist_count: parseInt(row.wishlist_count, 10),
      })),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async create(data: Partial<WishlistItem>): Promise<WishlistItem> {
    const item = this.repo.create(data);
    return this.repo.save(item);
  }

  async deleteByUserAndProduct(
    userId: number,
    productId: number,
  ): Promise<boolean> {
    const result = await this.repo.delete({
      user_id: userId,
      product_id: productId,
    });
    return (result.affected ?? 0) > 0;
  }
}
