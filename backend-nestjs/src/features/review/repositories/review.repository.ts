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

  async create(data: Partial<Review>): Promise<Review> {
    const review = this.repo.create(data);
    return this.repo.save(review);
  }

  async delete(id: number): Promise<void> {
    await this.repo.delete(id);
  }
}
