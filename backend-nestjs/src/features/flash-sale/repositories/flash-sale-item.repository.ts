import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { FlashSaleItem } from '../entities/flash-sale-item.entity';
import { FlashSaleItemStatus, FlashSaleStatus } from '../types/flash-sale.types';
import { IPaginatedResult } from '../../../common/interfaces/paginated-result.interface';

export interface IActiveFlashRow {
  item_id: number;
  product_variant_id: number;
  flash_price: number;
  flash_quantity: number;
  sold_quantity: number;
}

export interface IRegistrationFilter {
  page?: number;
  limit?: number;
  status?: FlashSaleItemStatus;
  flashSaleId?: number;
  forceShopId?: number;
}

@Injectable()
export class FlashSaleItemRepository {
  constructor(
    @InjectRepository(FlashSaleItem)
    private readonly repo: Repository<FlashSaleItem>,
  ) {}

  async findById(id: number): Promise<FlashSaleItem | null> {
    return this.repo.findOne({ where: { id }, relations: ['flash_sale'] });
  }

  /** Detail with product/variant/shop — used by the moderation & seller flows. */
  async findByIdWithRelations(id: number): Promise<FlashSaleItem | null> {
    return this.repo.findOne({
      where: { id },
      relations: [
        'flash_sale',
        'product_variant',
        'product_variant.product',
        'shop',
      ],
    });
  }

  /**
   * Whether the (campaign, variant) pair already has a *non-rejected*
   * registration. Rejected rows are ignored so a seller can re-register after
   * a rejection (mirrors the filtered UNIQUE index).
   */
  async existsInSale(
    flashSaleId: number,
    variantId: number,
  ): Promise<boolean> {
    return this.repo
      .createQueryBuilder('item')
      .where('item.flash_sale_id = :flashSaleId', { flashSaleId })
      .andWhere('item.product_variant_id = :variantId', { variantId })
      .andWhere('item.status <> :rejected', {
        rejected: FlashSaleItemStatus.Rejected,
      })
      .getExists();
  }

  async create(data: Partial<FlashSaleItem>): Promise<FlashSaleItem> {
    const entity = this.repo.create(data);
    return this.repo.save(entity);
  }

  async update(id: number, data: Partial<FlashSaleItem>): Promise<void> {
    await this.repo.update(id, data);
  }

  async delete(id: number): Promise<void> {
    await this.repo.delete(id);
  }

  /** All registrations for one campaign (moderation drawer), newest first. */
  async findByCampaignId(flashSaleId: number): Promise<FlashSaleItem[]> {
    return this.repo.find({
      where: { flash_sale_id: flashSaleId },
      relations: ['product_variant', 'product_variant.product', 'shop'],
      order: { id: 'DESC' },
    });
  }

  /**
   * Paginated registrations — powers the admin global moderation queue and the
   * seller "my registrations" list. `forceShopId` hard-scopes to one shop.
   */
  async findRegistrationsPaginated(
    filter: IRegistrationFilter,
  ): Promise<IPaginatedResult<FlashSaleItem>> {
    const qb = this.repo
      .createQueryBuilder('item')
      .leftJoinAndSelect('item.flash_sale', 'fs')
      .leftJoinAndSelect('item.product_variant', 'variant')
      .leftJoinAndSelect('variant.product', 'product')
      .leftJoinAndSelect('item.shop', 'shop');

    if (filter.forceShopId != null) {
      qb.andWhere('item.shop_id = :forceShopId', {
        forceShopId: filter.forceShopId,
      });
    }
    if (filter.flashSaleId != null) {
      qb.andWhere('item.flash_sale_id = :flashSaleId', {
        flashSaleId: filter.flashSaleId,
      });
    }
    if (filter.status) {
      qb.andWhere('item.status = :status', { status: filter.status });
    }

    qb.orderBy('item.id', 'DESC');

    const page = filter.page || 1;
    const limit = filter.limit || 20;
    qb.skip((page - 1) * limit).take(limit);

    const [data, total] = await qb.getManyAndCount();
    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  /**
   * The flash price rows in effect for the given variants *right now* — the
   * source of truth for flash pricing across checkout, preview and coupons.
   * Only APPROVED registrations of a live campaign are priced.
   */
  async findActiveByVariantIds(
    variantIds: number[],
    now: Date,
  ): Promise<IActiveFlashRow[]> {
    if (variantIds.length === 0) return [];
    const rows = await this.repo
      .createQueryBuilder('item')
      .innerJoin('item.flash_sale', 'fs')
      .select('item.id', 'item_id')
      .addSelect('item.product_variant_id', 'product_variant_id')
      .addSelect('item.flash_price', 'flash_price')
      .addSelect('item.flash_quantity', 'flash_quantity')
      .addSelect('item.sold_quantity', 'sold_quantity')
      .where('item.product_variant_id IN (:...variantIds)', { variantIds })
      .andWhere('item.status = :approved', {
        approved: FlashSaleItemStatus.Approved,
      })
      .andWhere('fs.is_active = 1')
      .andWhere('fs.status = :status', { status: FlashSaleStatus.Active })
      .andWhere('fs.starts_at <= :now', { now })
      .andWhere('fs.ends_at > :now', { now })
      .orderBy('fs.starts_at', 'ASC')
      .getRawMany<IActiveFlashRow>();
    return rows;
  }

  /**
   * Detect a time-overlapping campaign that already carries this variant as an
   * APPROVED item, to block ambiguous flash pricing at approval time. Considers
   * only live-ish campaigns (scheduled/active, is_active) other than
   * `excludeFlashSaleId`.
   */
  async hasOverlappingItem(
    variantId: number,
    startsAt: Date,
    endsAt: Date,
    excludeFlashSaleId: number,
  ): Promise<boolean> {
    return this.repo
      .createQueryBuilder('item')
      .innerJoin('item.flash_sale', 'fs')
      .where('item.product_variant_id = :variantId', { variantId })
      .andWhere('item.status = :approved', {
        approved: FlashSaleItemStatus.Approved,
      })
      .andWhere('fs.id != :excludeId', { excludeId: excludeFlashSaleId })
      .andWhere('fs.is_active = 1')
      .andWhere('fs.status != :ended', { ended: FlashSaleStatus.Ended })
      .andWhere('fs.starts_at < :endsAt', { endsAt })
      .andWhere('fs.ends_at > :startsAt', { startsAt })
      .getExists();
  }

  /**
   * Atomically reserve `qty` units of a flash item. Oversell-safe: the guard
   * clause ensures sold_quantity never exceeds flash_quantity. Requires the item
   * to still be APPROVED and its owning campaign live at `now` (active + inside
   * its time window), so a deal that ended — or a registration revoked — between
   * pricing and checkout can never be sold at the flash price. Runs inside the
   * checkout transaction so a failure rolls back the whole order.
   */
  async consume(
    itemId: number,
    qty: number,
    now: Date,
    manager: EntityManager,
  ): Promise<boolean> {
    const result = await manager
      .createQueryBuilder()
      .update(FlashSaleItem)
      .set({ sold_quantity: () => `sold_quantity + ${qty}` })
      .where('id = :id', { id: itemId })
      .andWhere('status = :approved', {
        approved: FlashSaleItemStatus.Approved,
      })
      .andWhere('sold_quantity + :qty <= flash_quantity', { qty })
      .andWhere(
        `EXISTS (
          SELECT 1 FROM flash_sales fs
          WHERE fs.id = flash_sale_items.flash_sale_id
            AND fs.is_active = 1
            AND fs.status = :activeStatus
            AND fs.starts_at <= :now
            AND fs.ends_at > :now
        )`,
        { activeStatus: FlashSaleStatus.Active, now },
      )
      .execute();
    return (result.affected ?? 0) > 0;
  }

  /** Give back reserved units on cancellation (guarded so it never goes below 0). */
  async reverse(itemId: number, qty: number): Promise<void> {
    await this.repo
      .createQueryBuilder()
      .update(FlashSaleItem)
      .set({
        sold_quantity: () =>
          `CASE WHEN sold_quantity - ${qty} < 0 THEN 0 ELSE sold_quantity - ${qty} END`,
      })
      .where('id = :id', { id: itemId })
      .execute();
  }
}
