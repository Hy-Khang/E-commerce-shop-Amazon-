import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { CouponUsage } from '../entities/coupon-usage.entity';
import { CouponUsageStatus } from '../types/coupon.types';
import { CouponUsageQueryDto } from '../dto/coupon-query.dto';
import { IPaginatedResult } from '../../../common/interfaces/paginated-result.interface';

@Injectable()
export class CouponUsageRepository {
  constructor(
    @InjectRepository(CouponUsage)
    private readonly repo: Repository<CouponUsage>,
  ) {}

  async countActiveByUserAndCoupon(
    userId: number,
    couponId: number,
  ): Promise<number> {
    const result = await this.repo
      .createQueryBuilder('usage')
      .innerJoin('usage.order', 'order')
      .select(
        "COUNT(DISTINCT COALESCE(order.order_group_id, CAST(order.id AS NVARCHAR(36))))",
        'count',
      )
      .where('usage.user_id = :userId', { userId })
      .andWhere('usage.coupon_id = :couponId', { couponId })
      .andWhere('usage.status = :status', {
        status: CouponUsageStatus.Applied,
      })
      .getRawOne();

    return parseInt(result?.count ?? '0', 10);
  }

  async findActiveByGroupId(orderGroupId: string): Promise<CouponUsage[]> {
    return this.repo
      .createQueryBuilder('usage')
      .innerJoin('usage.order', 'order')
      .where('order.order_group_id = :orderGroupId', { orderGroupId })
      .andWhere('usage.status = :status', {
        status: CouponUsageStatus.Applied,
      })
      .getMany();
  }

  async createUsage(
    data: Partial<CouponUsage>,
    manager: EntityManager,
  ): Promise<CouponUsage> {
    const usage = manager.create(CouponUsage, data);
    return manager.save(usage);
  }

  async findByOrderId(orderId: number): Promise<CouponUsage | null> {
    return this.repo.findOne({
      where: { order_id: orderId, status: CouponUsageStatus.Applied },
    });
  }

  async updateStatus(id: number, status: string): Promise<void> {
    await this.repo.update(id, { status });
  }

  async findByCouponIdPaginated(
    couponId: number,
    page: number,
    limit: number,
  ): Promise<IPaginatedResult<CouponUsage>> {
    const [data, total] = await this.repo.findAndCount({
      where: { coupon_id: couponId },
      relations: ['coupon', 'user'],
      order: { created_at: 'DESC' },
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
    query: CouponUsageQueryDto,
  ): Promise<IPaginatedResult<CouponUsage>> {
    const qb = this.repo
      .createQueryBuilder('usage')
      .leftJoinAndSelect('usage.coupon', 'coupon')
      .leftJoinAndSelect('usage.user', 'user');

    if (query.coupon_id) {
      qb.andWhere('usage.coupon_id = :couponId', {
        couponId: query.coupon_id,
      });
    }

    if (query.user_id) {
      qb.andWhere('usage.user_id = :userId', { userId: query.user_id });
    }

    qb.orderBy('usage.created_at', 'DESC');

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
}
