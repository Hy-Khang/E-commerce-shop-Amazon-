import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { FlashSaleRepository } from './repositories/flash-sale.repository';
import { FlashSaleItemRepository } from './repositories/flash-sale-item.repository';
import { CreateFlashSaleDto } from './dto/create-flash-sale.dto';
import { UpdateFlashSaleDto } from './dto/update-flash-sale.dto';
import { RegisterFlashSaleItemDto } from './dto/register-flash-sale-item.dto';
import { UpdateFlashSaleItemDto } from './dto/update-flash-sale-item.dto';
import { FlashSaleQueryDto } from './dto/flash-sale-query.dto';
import { FlashRegistrationQueryDto } from './dto/flash-registration-query.dto';
import {
  FlashSaleItemResponseDto,
  FlashSaleResponseDto,
} from './dto/flash-sale-response.dto';
import { FlashSale } from './entities/flash-sale.entity';
import { FlashSaleItem } from './entities/flash-sale-item.entity';
import { Shop } from '../shop/entities/shop.entity';
import {
  FlashSaleItemStatus,
  FlashSaleStatus,
  IActiveFlashPrice,
} from './types/flash-sale.types';
import {
  toFlashSaleItemResponse,
  toFlashSaleResponse,
} from './utils/flash-sale.util';
import { ProductService } from '../product/product.service';
import { ShopService } from '../shop/shop.service';
import { IPaginatedResult } from '../../common/interfaces/paginated-result.interface';

@Injectable()
export class FlashSaleService {
  private readonly logger = new Logger(FlashSaleService.name);

  constructor(
    private readonly flashSaleRepository: FlashSaleRepository,
    private readonly flashSaleItemRepository: FlashSaleItemRepository,
    private readonly productService: ProductService,
    private readonly shopService: ShopService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  // ─── Cross-feature: consumed by OrderService & CouponService ───

  /**
   * Single source of truth for flash pricing. Returns the active flash price +
   * remaining stock for each of the given variants (variants with no active,
   * APPROVED flash are simply absent). If a variant is (mis)configured into two
   * live campaigns, the earliest-starting one wins deterministically.
   */
  async getActiveFlashPriceMap(
    variantIds: number[],
  ): Promise<Map<number, IActiveFlashPrice>> {
    const map = new Map<number, IActiveFlashPrice>();
    const unique = [...new Set(variantIds)].filter((id) => id != null);
    if (unique.length === 0) return map;

    const rows = await this.flashSaleItemRepository.findActiveByVariantIds(
      unique,
      new Date(),
    );

    for (const row of rows) {
      // rows are ordered by starts_at ASC → first occurrence wins.
      if (map.has(row.product_variant_id)) continue;
      map.set(row.product_variant_id, {
        flashItemId: row.item_id,
        flashPrice: Number(row.flash_price),
        remaining: Number(row.flash_quantity) - Number(row.sold_quantity),
      });
    }

    return map;
  }

  /** Oversell-safe reserve, inside the checkout transaction. */
  async consume(
    flashItemId: number,
    qty: number,
    manager: EntityManager,
  ): Promise<void> {
    const ok = await this.flashSaleItemRepository.consume(
      flashItemId,
      qty,
      new Date(),
      manager,
    );
    if (!ok) {
      throw new BadRequestException({
        code: 'FLASH_SALE_006',
        message: 'Flash sale item is sold out or has insufficient quantity',
      });
    }
  }

  /** Release reserved flash units on cancellation. */
  async reverse(flashItemId: number, qty: number): Promise<void> {
    await this.flashSaleItemRepository.reverse(flashItemId, qty);
  }

  // ─── Public (storefront) ───

  async findActiveCampaigns(): Promise<FlashSaleResponseDto[]> {
    const campaigns = await this.flashSaleRepository.findActiveWithProducts(
      new Date(),
    );
    // Hide live campaigns that have no approved items yet.
    return campaigns
      .filter((c) => (c.items?.length ?? 0) > 0)
      .map(toFlashSaleResponse);
  }

  async findActiveCampaignById(id: number): Promise<FlashSaleResponseDto> {
    const campaign = await this.flashSaleRepository.findByIdPublic(
      id,
      new Date(),
    );
    if (!campaign) {
      throw new NotFoundException({
        code: 'FLASH_SALE_001',
        message: 'Flash sale not found',
      });
    }
    return toFlashSaleResponse(campaign);
  }

  // ─── Admin: campaign CRUD ───

  async findAllCampaigns(
    query: FlashSaleQueryDto,
  ): Promise<IPaginatedResult<FlashSaleResponseDto>> {
    const result = await this.flashSaleRepository.findAllPaginated(query);
    return {
      data: result.data.map(toFlashSaleResponse),
      meta: result.meta,
    };
  }

  async findCampaignById(id: number): Promise<FlashSaleResponseDto> {
    const campaign = await this.getCampaignOrThrow(id);
    return toFlashSaleResponse(campaign);
  }

  async createCampaign(dto: CreateFlashSaleDto): Promise<FlashSaleResponseDto> {
    const regStart = new Date(dto.registration_starts_at);
    const regEnd = new Date(dto.registration_ends_at);
    const startsAt = new Date(dto.starts_at);
    const endsAt = new Date(dto.ends_at);
    this.assertValidWindow(regStart, regEnd, startsAt, endsAt);

    const campaign = await this.flashSaleRepository.create({
      name: dto.name,
      registration_starts_at: regStart,
      registration_ends_at: regEnd,
      starts_at: startsAt,
      ends_at: endsAt,
      min_discount_percent: dto.min_discount_percent,
      status: this.computeStatus(startsAt, endsAt, new Date()),
    });

    this.logger.log(`Flash sale created: ${campaign.name} (id=${campaign.id})`);
    return this.findCampaignById(campaign.id);
  }

  async updateCampaign(
    id: number,
    dto: UpdateFlashSaleDto,
  ): Promise<FlashSaleResponseDto> {
    const campaign = await this.flashSaleRepository.findById(id);
    if (!campaign) {
      throw new NotFoundException({
        code: 'FLASH_SALE_001',
        message: 'Flash sale not found',
      });
    }

    const regStart = dto.registration_starts_at
      ? new Date(dto.registration_starts_at)
      : campaign.registration_starts_at;
    const regEnd = dto.registration_ends_at
      ? new Date(dto.registration_ends_at)
      : campaign.registration_ends_at;
    const startsAt = dto.starts_at
      ? new Date(dto.starts_at)
      : campaign.starts_at;
    const endsAt = dto.ends_at ? new Date(dto.ends_at) : campaign.ends_at;
    this.assertValidWindow(regStart, regEnd, startsAt, endsAt);

    const patch: Partial<FlashSale> = { updated_at: new Date() };
    if (dto.name !== undefined) patch.name = dto.name;
    if (dto.registration_starts_at !== undefined)
      patch.registration_starts_at = regStart;
    if (dto.registration_ends_at !== undefined)
      patch.registration_ends_at = regEnd;
    if (dto.starts_at !== undefined) patch.starts_at = startsAt;
    if (dto.ends_at !== undefined) patch.ends_at = endsAt;
    if (dto.min_discount_percent !== undefined)
      patch.min_discount_percent = dto.min_discount_percent;
    if (dto.is_active !== undefined) patch.is_active = dto.is_active;

    // Re-derive status whenever the deal window moved so the campaign is usable
    // immediately without waiting for the cron tick.
    if (dto.starts_at !== undefined || dto.ends_at !== undefined) {
      patch.status = this.computeStatus(startsAt, endsAt, new Date());
    }

    await this.flashSaleRepository.update(id, patch);
    this.logger.log(`Flash sale updated: id=${id}`);
    return this.findCampaignById(id);
  }

  async deleteCampaign(id: number): Promise<void> {
    const campaign = await this.flashSaleRepository.findById(id);
    if (!campaign) {
      throw new NotFoundException({
        code: 'FLASH_SALE_001',
        message: 'Flash sale not found',
      });
    }
    // FK ON DELETE CASCADE removes flash_sale_items automatically.
    await this.flashSaleRepository.delete(id);
    this.logger.log(`Flash sale deleted: id=${id}`);
  }

  // ─── Admin: registration moderation ───

  /** Global moderation queue across all campaigns (filter by status). */
  async listRegistrations(
    query: FlashRegistrationQueryDto,
  ): Promise<IPaginatedResult<FlashSaleItemResponseDto>> {
    const result =
      await this.flashSaleItemRepository.findRegistrationsPaginated({
        page: query.page,
        limit: query.limit,
        status: query.status,
      });
    return {
      data: result.data.map(toFlashSaleItemResponse),
      meta: result.meta,
    };
  }

  /** All registrations for one campaign (moderation drawer). */
  async findCampaignItems(
    campaignId: number,
  ): Promise<FlashSaleItemResponseDto[]> {
    await this.getCampaignOrThrow(campaignId);
    const items =
      await this.flashSaleItemRepository.findByCampaignId(campaignId);
    return items.map(toFlashSaleItemResponse);
  }

  async approveItem(
    itemId: number,
    adminId: number,
  ): Promise<FlashSaleItemResponseDto> {
    const item = await this.getItemForModerationOrThrow(itemId);
    if (item.status !== FlashSaleItemStatus.Pending) {
      throw new BadRequestException({
        code: 'FLASH_SALE_013',
        message: 'Only pending registrations can be approved',
      });
    }

    // Ambiguous-price guard: block approving a variant that another
    // time-overlapping campaign already carries as an approved item.
    const overlaps = await this.flashSaleItemRepository.hasOverlappingItem(
      item.product_variant_id,
      item.flash_sale.starts_at,
      item.flash_sale.ends_at,
      item.flash_sale_id,
    );
    if (overlaps) {
      throw new BadRequestException({
        code: 'FLASH_SALE_012',
        message:
          'Cannot approve: this variant is already approved in an overlapping campaign',
      });
    }

    await this.flashSaleItemRepository.update(itemId, {
      status: FlashSaleItemStatus.Approved,
      reviewed_by: adminId,
      reviewed_at: new Date(),
      reject_reason: null,
    });
    this.logger.log(
      `Flash registration approved: item=${itemId} by ${adminId}`,
    );
    this.emitReviewed(item, 'approved');

    return this.reloadItemResponse(itemId);
  }

  async rejectItem(
    itemId: number,
    adminId: number,
    reason?: string,
  ): Promise<FlashSaleItemResponseDto> {
    const item = await this.getItemForModerationOrThrow(itemId);
    if (item.status === FlashSaleItemStatus.Rejected) {
      throw new BadRequestException({
        code: 'FLASH_SALE_013',
        message: 'Registration is already rejected',
      });
    }

    await this.flashSaleItemRepository.update(itemId, {
      status: FlashSaleItemStatus.Rejected,
      reviewed_by: adminId,
      reviewed_at: new Date(),
      reject_reason: reason ?? null,
    });
    this.logger.log(
      `Flash registration rejected: item=${itemId} by ${adminId}`,
    );
    this.emitReviewed(item, 'rejected', reason);

    return this.reloadItemResponse(itemId);
  }

  /** Admin removes a registration entirely (hard delete). */
  async removeItem(itemId: number): Promise<void> {
    const item = await this.flashSaleItemRepository.findById(itemId);
    if (!item) {
      throw new NotFoundException({
        code: 'FLASH_SALE_002',
        message: 'Flash sale item not found',
      });
    }
    await this.flashSaleItemRepository.delete(itemId);
    this.logger.log(`Flash sale item removed: id=${itemId}`);
  }

  // ─── Seller: registration ───

  async findOpenCampaignsForSeller(
    userId: number,
  ): Promise<FlashSaleResponseDto[]> {
    const shop = await this.shopService.resolveShopByUserId(userId);
    this.shopService.assertShopIsActive(shop);
    const campaigns = await this.flashSaleRepository.findOpenForRegistration(
      new Date(),
    );
    return campaigns.map(toFlashSaleResponse);
  }

  async findSellerRegistrations(
    userId: number,
    query: FlashRegistrationQueryDto,
  ): Promise<IPaginatedResult<FlashSaleItemResponseDto>> {
    const shop = await this.shopService.resolveShopByUserId(userId);
    const result =
      await this.flashSaleItemRepository.findRegistrationsPaginated({
        page: query.page,
        limit: query.limit,
        status: query.status,
        forceShopId: shop.id,
      });
    return {
      data: result.data.map(toFlashSaleItemResponse),
      meta: result.meta,
    };
  }

  async findSellerCampaign(
    userId: number,
    campaignId: number,
  ): Promise<FlashSaleResponseDto> {
    const shop = await this.shopService.resolveShopByUserId(userId);
    const campaign = await this.flashSaleRepository.findById(campaignId);
    if (!campaign) {
      throw new NotFoundException({
        code: 'FLASH_SALE_001',
        message: 'Flash sale not found',
      });
    }
    // Show only this shop's registrations for the campaign.
    const items = await this.flashSaleItemRepository.findRegistrationsPaginated(
      {
        page: 1,
        limit: 200,
        forceShopId: shop.id,
        flashSaleId: campaignId,
      },
    );
    campaign.items = items.data;
    return toFlashSaleResponse(campaign);
  }

  async registerItem(
    userId: number,
    campaignId: number,
    dto: RegisterFlashSaleItemDto,
  ): Promise<FlashSaleItemResponseDto> {
    const shop = await this.shopService.resolveShopByUserId(userId);
    this.shopService.assertShopIsActive(shop);

    const campaign = await this.flashSaleRepository.findById(campaignId);
    if (!campaign) {
      throw new NotFoundException({
        code: 'FLASH_SALE_001',
        message: 'Flash sale not found',
      });
    }
    this.assertRegistrationOpen(campaign, new Date());

    const variant = await this.productService.findVariantById(
      dto.product_variant_id,
    );
    if (!variant) {
      throw new NotFoundException({
        code: 'PRODUCT_002',
        message: 'Variant not found',
      });
    }
    if (variant.product?.shop_id !== shop.id) {
      throw new BadRequestException({
        code: 'FLASH_SALE_010',
        message: 'This variant does not belong to your shop',
      });
    }

    this.assertDiscountFloor(
      dto.flash_price,
      Number(variant.price),
      Number(campaign.min_discount_percent),
    );

    const alreadyIn = await this.flashSaleItemRepository.existsInSale(
      campaignId,
      dto.product_variant_id,
    );
    if (alreadyIn) {
      throw new ConflictException({
        code: 'FLASH_SALE_004',
        message: 'This variant is already registered in the campaign',
      });
    }

    let created: FlashSaleItem;
    try {
      created = await this.flashSaleItemRepository.create({
        flash_sale_id: campaignId,
        product_variant_id: dto.product_variant_id,
        shop_id: shop.id,
        flash_price: dto.flash_price,
        flash_quantity: dto.flash_quantity,
        sold_quantity: 0,
        status: FlashSaleItemStatus.Pending,
        created_by: userId,
      });
    } catch (error: any) {
      if (error?.number === 2627 || error?.number === 2601) {
        throw new ConflictException({
          code: 'FLASH_SALE_004',
          message: 'This variant is already registered in the campaign',
        });
      }
      throw error;
    }

    this.logger.log(
      `Flash registration created: campaign=${campaignId}, variant=${dto.product_variant_id}, shop=${shop.id}`,
    );
    return this.reloadItemResponse(created.id);
  }

  async updateSellerItem(
    userId: number,
    itemId: number,
    dto: UpdateFlashSaleItemDto,
  ): Promise<FlashSaleItemResponseDto> {
    const { item } = await this.assertSellerOwnsItem(userId, itemId);
    if (item.status !== FlashSaleItemStatus.Pending) {
      throw new BadRequestException({
        code: 'FLASH_SALE_013',
        message: 'Only pending registrations can be edited',
      });
    }

    const patch: Partial<FlashSaleItem> = {};
    if (dto.flash_price !== undefined) {
      this.assertDiscountFloor(
        dto.flash_price,
        Number(item.product_variant.price),
        Number(item.flash_sale.min_discount_percent),
      );
      patch.flash_price = dto.flash_price;
    }
    if (dto.flash_quantity !== undefined) {
      if (dto.flash_quantity < item.sold_quantity) {
        throw new BadRequestException({
          code: 'FLASH_SALE_007',
          message: `flash_quantity cannot be less than already-sold quantity (${item.sold_quantity})`,
        });
      }
      patch.flash_quantity = dto.flash_quantity;
    }

    await this.flashSaleItemRepository.update(itemId, patch);
    this.logger.log(`Flash registration updated by seller: item=${itemId}`);
    return this.reloadItemResponse(itemId);
  }

  async withdrawSellerItem(userId: number, itemId: number): Promise<void> {
    const { item } = await this.assertSellerOwnsItem(userId, itemId);
    if (item.status !== FlashSaleItemStatus.Pending) {
      throw new BadRequestException({
        code: 'FLASH_SALE_013',
        message: 'Only pending registrations can be withdrawn',
      });
    }
    await this.flashSaleItemRepository.delete(itemId);
    this.logger.log(`Flash registration withdrawn by seller: item=${itemId}`);
  }

  // ─── Private helpers ───

  private async getCampaignOrThrow(id: number): Promise<FlashSale> {
    const campaign = await this.flashSaleRepository.findByIdWithProducts(id);
    if (!campaign) {
      throw new NotFoundException({
        code: 'FLASH_SALE_001',
        message: 'Flash sale not found',
      });
    }
    return campaign;
  }

  private async getItemForModerationOrThrow(
    itemId: number,
  ): Promise<FlashSaleItem> {
    const item =
      await this.flashSaleItemRepository.findByIdWithRelations(itemId);
    if (!item) {
      throw new NotFoundException({
        code: 'FLASH_SALE_002',
        message: 'Flash sale item not found',
      });
    }
    return item;
  }

  private async reloadItemResponse(
    itemId: number,
  ): Promise<FlashSaleItemResponseDto> {
    const item =
      await this.flashSaleItemRepository.findByIdWithRelations(itemId);
    return toFlashSaleItemResponse(item!);
  }

  /**
   * Resolves the caller's shop and asserts the registration is owned by it.
   * Rejects registrations of other shops with FLASH_SALE_008.
   */
  private async assertSellerOwnsItem(
    userId: number,
    itemId: number,
  ): Promise<{ shop: Shop; item: FlashSaleItem }> {
    const shop = await this.shopService.resolveShopByUserId(userId);
    const item =
      await this.flashSaleItemRepository.findByIdWithRelations(itemId);
    if (!item || item.shop_id !== shop.id) {
      throw new ForbiddenException({
        code: 'FLASH_SALE_008',
        message: 'You do not have access to this registration',
      });
    }
    return { shop, item };
  }

  private emitReviewed(
    item: FlashSaleItem,
    decision: 'approved' | 'rejected',
    reason?: string,
  ): void {
    this.eventEmitter.emit('flash_sale.registration_reviewed', {
      itemId: item.id,
      campaignId: item.flash_sale_id,
      campaignName: item.flash_sale?.name ?? '',
      shopId: item.shop_id,
      sellerUserId: item.shop?.user_id ?? item.created_by ?? 0,
      productName: item.product_variant?.product?.name ?? null,
      decision,
      reason: reason ?? null,
    });
  }

  private assertRegistrationOpen(campaign: FlashSale, now: Date): void {
    const open =
      campaign.status === FlashSaleStatus.Scheduled &&
      now >= campaign.registration_starts_at &&
      now < campaign.registration_ends_at;
    if (!open) {
      throw new BadRequestException({
        code: 'FLASH_SALE_009',
        message: 'This campaign is not open for registration',
      });
    }
  }

  private assertDiscountFloor(
    flashPrice: number,
    originalPrice: number,
    minPercent: number,
  ): void {
    if (!(originalPrice > 0) || flashPrice >= originalPrice) {
      throw new BadRequestException({
        code: 'FLASH_SALE_011',
        message: 'Flash price must be lower than the original price',
      });
    }
    const discountPercent = (1 - flashPrice / originalPrice) * 100;
    // Small epsilon so a price that rounds to exactly the floor is accepted.
    if (discountPercent + 1e-6 < minPercent) {
      throw new BadRequestException({
        code: 'FLASH_SALE_011',
        message: `Flash price must be at least ${minPercent}% below the original price`,
      });
    }
  }

  private assertValidWindow(
    regStart: Date,
    regEnd: Date,
    startsAt: Date,
    endsAt: Date,
  ): void {
    if (
      !(
        regStart < regEnd &&
        regEnd.getTime() <= startsAt.getTime() &&
        startsAt < endsAt
      )
    ) {
      throw new BadRequestException({
        code: 'FLASH_SALE_003',
        message:
          'Invalid window: require registration_starts_at < registration_ends_at ≤ starts_at < ends_at',
      });
    }
  }

  private computeStatus(
    startsAt: Date,
    endsAt: Date,
    now: Date,
  ): FlashSaleStatus {
    if (now >= endsAt) return FlashSaleStatus.Ended;
    if (now >= startsAt) return FlashSaleStatus.Active;
    return FlashSaleStatus.Scheduled;
  }
}
