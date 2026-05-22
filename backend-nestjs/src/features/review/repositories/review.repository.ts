import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Review } from '../entities/review.entity';
import { ReviewQueryDto } from '../dto/review-query.dto';
import { IPaginatedResult } from '../../../common/interfaces/paginated-result.interface';

@Injectable()
export class ReviewRepository {
  constructor(
    @InjectRepository(Review)
    private readonly repo: Repository<Review>,
  ) {}

  async findById(id: number): Promise<Review | null> {
    return this.repo.findOne({ where: { id } });
  }

  async findByIdWithUser(id: number): Promise<Review | null> {
    return this.repo.findOne({
      where: { id },
      relations: ['user'],
    });
  }

  async findByUserAndOrderAndProduct(
    userId: number,
    orderId: number,
    productId: number,
  ): Promise<Review | null> {
    return this.repo.findOne({
      where: { user_id: userId, order_id: orderId, product_id: productId },
    });
  }

  async findByProductIdPaginated(
    productId: number,
    page: number,
    limit: number,
    sort = 'created_at',
    order: 'asc' | 'desc' = 'desc',
  ): Promise<IPaginatedResult<Review>> {
    const [data, total] = await this.repo.findAndCount({
      where: { product_id: productId },
      relations: ['user'],
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

  async findByUserIdPaginated(
    userId: number,
    page: number,
    limit: number,
    sort = 'created_at',
    order: 'asc' | 'desc' = 'desc',
  ): Promise<IPaginatedResult<Review>> {
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

  async findAllPaginated(
    query: ReviewQueryDto,
  ): Promise<IPaginatedResult<Review>> {
    const qb = this.repo
      .createQueryBuilder('review')
      .leftJoinAndSelect('review.user', 'user')
      .leftJoinAndSelect('review.product', 'product');

    if (query.product_id) {
      qb.andWhere('review.product_id = :productId', {
        productId: query.product_id,
      });
    }

    if (query.user_id) {
      qb.andWhere('review.user_id = :userId', { userId: query.user_id });
    }

    if (query.rating) {
      qb.andWhere('review.rating = :rating', { rating: query.rating });
    }

    const sort = query.sort || 'created_at';
    const order = (query.order || 'desc').toUpperCase() as 'ASC' | 'DESC';
    qb.orderBy(`review.${sort}`, order);

    const page = query.page || 1;
    const limit = query.limit || 20;
    qb.skip((page - 1) * limit).take(limit);

    const [data, total] = await qb.getManyAndCount();

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

  async getReviewStats(
    productId: number,
  ): Promise<{
    average_rating: number;
    total_reviews: number;
    rating_distribution: Record<number, number>;
  }> {
    const stats = await this.repo
      .createQueryBuilder('review')
      .select('AVG(CAST(review.rating AS FLOAT))', 'average_rating')
      .addSelect('COUNT(*)', 'total_reviews')
      .where('review.product_id = :productId', { productId })
      .getRawOne();

    const distribution = await this.repo
      .createQueryBuilder('review')
      .select('review.rating', 'rating')
      .addSelect('COUNT(*)', 'count')
      .where('review.product_id = :productId', { productId })
      .groupBy('review.rating')
      .getRawMany();

    const ratingDistribution: Record<number, number> = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    };
    for (const row of distribution) {
      ratingDistribution[row.rating] = parseInt(row.count, 10);
    }

    return {
      average_rating: parseFloat(stats.average_rating) || 0,
      total_reviews: parseInt(stats.total_reviews, 10),
      rating_distribution: ratingDistribution,
    };
  }

  async findVariantInfoForReviews(
    pairs: { order_id: number; product_id: number }[],
  ): Promise<Map<string, { color: string | null; size: string | null }>> {
    if (pairs.length === 0) return new Map();

    const orderIds = [...new Set(pairs.map((p) => p.order_id))];

    const results = await this.repo.manager
      .createQueryBuilder()
      .select(['oi.order_id', 'pv.product_id', 'pv.color', 'pv.size'])
      .from('order_items', 'oi')
      .innerJoin('product_variants', 'pv', 'oi.product_variant_id = pv.id')
      .where('oi.order_id IN (:...orderIds)', { orderIds })
      .getRawMany();

    const map = new Map<
      string,
      { color: string | null; size: string | null }
    >();
    for (const row of results) {
      const key = `${row.oi_order_id}-${row.pv_product_id}`;
      if (!map.has(key)) {
        map.set(key, {
          color: row.pv_color ?? null,
          size: row.pv_size ?? null,
        });
      }
    }
    return map;
  }

  async create(data: Partial<Review>): Promise<Review> {
    const review = this.repo.create(data);
    return this.repo.save(review);
  }

  async delete(id: number): Promise<void> {
    await this.repo.delete(id);
  }
}
