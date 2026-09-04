import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FlashSale } from '../entities/flash-sale.entity';
import { FlashSaleQueryDto } from '../dto/flash-sale-query.dto';
import {
  FlashSaleItemStatus,
  FlashSaleStatus,
} from '../types/flash-sale.types';
import { IPaginatedResult } from '../../../common/interfaces/paginated-result.interface';

@Injectable()
export class FlashSaleRepository {
  constructor(
    @InjectRepository(FlashSale)
    private readonly repo: Repository<FlashSale>,
  ) {}

  /** Campaign with its items (no product joins) — used by admin list rows. */
  async findById(id: number): Promise<FlashSale | null> {
    return this.repo.findOne({ where: { id }, relations: ['items'] });
  }

  /**
   * Admin: campaign with ALL its registrations (any status) + variant + product
   * + owning shop. Used by the moderation detail view.
   */
  async findByIdWithProducts(id: number): Promise<FlashSale | null> {
    return this.repo
      .createQueryBuilder('fs')
      .leftJoinAndSelect('fs.items', 'items')
      .leftJoinAndSelect('items.product_variant', 'variant')
      .leftJoinAndSelect('variant.product', 'product')
      .leftJoinAndSelect('items.shop', 'shop')
      .where('fs.id = :id', { id })
      .orderBy('items.id', 'DESC')
      .getOne();
  }

  /**
   * Public: a live campaign (active + inside its window) with only its APPROVED
   * items. Returns null for non-live campaigns so the public detail 404s and
   * pending/rejected registrations never leak to the storefront.
   */
  async findByIdPublic(id: number, now: Date): Promise<FlashSale | null> {
    return this.repo
      .createQueryBuilder('fs')
      .leftJoinAndSelect('fs.items', 'items', 'items.status = :approved', {
        approved: FlashSaleItemStatus.Approved,
      })
      .leftJoinAndSelect('items.product_variant', 'variant')
      .leftJoinAndSelect('variant.product', 'product')
      .where('fs.id = :id', { id })
      .andWhere('fs.is_active = :active', { active: true })
      .andWhere('fs.status = :status', { status: FlashSaleStatus.Active })
      .andWhere('fs.starts_at <= :now', { now })
      .andWhere('fs.ends_at > :now', { now })
      .getOne();
  }

  async findAllPaginated(
    query: FlashSaleQueryDto,
  ): Promise<IPaginatedResult<FlashSale>> {
    const qb = this.repo
      .createQueryBuilder('fs')
      .leftJoinAndSelect('fs.items', 'items');

    if (query.search) {
      qb.andWhere('fs.name LIKE :search', { search: `%${query.search}%` });
    }
    if (query.status) {
      qb.andWhere('fs.status = :status', { status: query.status });
    }
    if (query.is_active !== undefined) {
      qb.andWhere('fs.is_active = :isActive', {
        isActive: query.is_active === 'true',
      });
    }

    const sort = query.sort || 'created_at';
    const order = (query.order || 'desc').toUpperCase() as 'ASC' | 'DESC';
    qb.orderBy(`fs.${sort}`, order);

    const page = query.page || 1;
    const limit = query.limit || 20;
    qb.skip((page - 1) * limit).take(limit);

    const [data, total] = await qb.getManyAndCount();

    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  /**
   * Public: campaigns currently live (active status + within time window), each
   * carrying only its APPROVED items (join condition — so a campaign with zero
   * approved items is still returned, then filtered out in the service).
   */
  async findActiveWithProducts(now: Date): Promise<FlashSale[]> {
    return this.repo
      .createQueryBuilder('fs')
      .leftJoinAndSelect('fs.items', 'items', 'items.status = :approved', {
        approved: FlashSaleItemStatus.Approved,
      })
      .leftJoinAndSelect('items.product_variant', 'variant')
      .leftJoinAndSelect('variant.product', 'product')
      .where('fs.is_active = :active', { active: true })
      .andWhere('fs.status = :status', { status: FlashSaleStatus.Active })
      .andWhere('fs.starts_at <= :now', { now })
      .andWhere('fs.ends_at > :now', { now })
      .orderBy('fs.ends_at', 'ASC')
      .getMany();
  }

  /**
   * Seller: campaigns currently open for registration — `scheduled` and now
   * inside [registration_starts_at, registration_ends_at). No items loaded.
   */
  async findOpenForRegistration(now: Date): Promise<FlashSale[]> {
    return this.repo
      .createQueryBuilder('fs')
      .where('fs.is_active = :active', { active: true })
      .andWhere('fs.status = :scheduled', {
        scheduled: FlashSaleStatus.Scheduled,
      })
      .andWhere('fs.registration_starts_at <= :now', { now })
      .andWhere('fs.registration_ends_at > :now', { now })
      .orderBy('fs.starts_at', 'ASC')
      .getMany();
  }

  async create(data: Partial<FlashSale>): Promise<FlashSale> {
    const entity = this.repo.create(data);
    return this.repo.save(entity);
  }

  async update(id: number, data: Partial<FlashSale>): Promise<void> {
    await this.repo.update(id, data);
  }

  async delete(id: number): Promise<void> {
    await this.repo.delete(id);
  }

  /** Cron: scheduled → active for campaigns whose window has opened. */
  async activateDue(now: Date): Promise<number> {
    const result = await this.repo
      .createQueryBuilder()
      .update(FlashSale)
      .set({
        status: FlashSaleStatus.Active,
        updated_at: () => 'SYSUTCDATETIME()',
      })
      .where('is_active = 1')
      .andWhere('status = :scheduled', { scheduled: FlashSaleStatus.Scheduled })
      .andWhere('starts_at <= :now', { now })
      .andWhere('ends_at > :now', { now })
      .execute();
    return result.affected ?? 0;
  }

  /** Cron: active/scheduled → ended for campaigns past their end time. */
  async endDue(now: Date): Promise<number> {
    const result = await this.repo
      .createQueryBuilder()
      .update(FlashSale)
      .set({
        status: FlashSaleStatus.Ended,
        updated_at: () => 'SYSUTCDATETIME()',
      })
      .where('status != :ended', { ended: FlashSaleStatus.Ended })
      .andWhere('ends_at <= :now', { now })
      .execute();
    return result.affected ?? 0;
  }
}
