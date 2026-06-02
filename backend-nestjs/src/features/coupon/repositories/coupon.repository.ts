import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, EntityManager, Repository } from 'typeorm';
import { Coupon } from '../entities/coupon.entity';
import { CouponQueryDto } from '../dto/coupon-query.dto';
import { IPaginatedResult } from '../../../common/interfaces/paginated-result.interface';

@Injectable()
export class CouponRepository {
  constructor(
    @InjectRepository(Coupon)
    private readonly repo: Repository<Coupon>,
  ) {}

  async findByCode(code: string): Promise<Coupon | null> {
    return this.repo.findOne({
      where: { code },
      relations: ['coupon_categories', 'coupon_products'],
    });
  }

  async findById(id: number): Promise<Coupon | null> {
    return this.repo.findOne({
      where: { id },
      relations: ['coupon_categories', 'coupon_products'],
    });
  }

  async findAllPaginated(
    query: CouponQueryDto,
  ): Promise<IPaginatedResult<Coupon>> {
    const qb = this.repo
      .createQueryBuilder('coupon')
      .leftJoinAndSelect('coupon.coupon_categories', 'cc')
      .leftJoinAndSelect('coupon.coupon_products', 'cp');

    if (query.search) {
      qb.andWhere('coupon.code LIKE :search', {
        search: `%${query.search}%`,
      });
    }

    if (query.scope) {
      qb.andWhere('coupon.scope = :scope', { scope: query.scope });
    }

    if (query.discount_type) {
      qb.andWhere('coupon.discount_type = :discountType', {
        discountType: query.discount_type,
      });
    }

    if (query.is_active !== undefined) {
      const isActive = query.is_active === 'true';
      qb.andWhere('coupon.is_active = :isActive', { isActive });
    }

    const sort = query.sort || 'created_at';
    const order = (query.order || 'desc').toUpperCase() as 'ASC' | 'DESC';
    qb.orderBy(`coupon.${sort}`, order);

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

  async create(data: Partial<Coupon>): Promise<Coupon> {
    const coupon = this.repo.create(data);
    return this.repo.save(coupon);
  }

  async update(id: number, data: Partial<Coupon>): Promise<void> {
    await this.repo.update(id, data);
  }

  async incrementUsage(
    couponId: number,
    manager: EntityManager,
  ): Promise<boolean> {
    const result = await manager
      .createQueryBuilder()
      .update(Coupon)
      .set({ current_uses: () => 'current_uses + 1' })
      .where('id = :id', { id: couponId })
      .andWhere(
        new Brackets((qb) => {
          qb.where('max_uses IS NULL').orWhere('current_uses < max_uses');
        }),
      )
      .execute();

    return (result.affected ?? 0) > 0;
  }

  async decrementUsage(couponId: number): Promise<void> {
    await this.repo
      .createQueryBuilder()
      .update(Coupon)
      .set({ current_uses: () => 'CASE WHEN current_uses > 0 THEN current_uses - 1 ELSE 0 END' })
      .where('id = :id', { id: couponId })
      .execute();
  }

  async existsByCode(code: string): Promise<boolean> {
    const count = await this.repo.count({ where: { code } });
    return count > 0;
  }
}
