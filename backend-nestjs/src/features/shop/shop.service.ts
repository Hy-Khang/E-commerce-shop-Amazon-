import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ShopRepository, IShopFilter } from './repositories/shop.repository';
import { CreateShopDto } from './dto/create-shop.dto';
import { UpdateShopDto } from './dto/update-shop.dto';
import { Shop } from './entities/shop.entity';
import { ShopStatus } from '../../common/constants';
import { IPaginatedResult } from '../../common/interfaces/paginated-result.interface';
import { generateSlug } from '../../common/utils/slug.util';

@Injectable()
export class ShopService {
  private readonly logger = new Logger(ShopService.name);

  constructor(private readonly shopRepository: ShopRepository) {}

  // ─── Helpers (consumed by other features via DI) ───

  async resolveShopByUserId(userId: number): Promise<Shop> {
    const shop = await this.shopRepository.findByUserId(userId);
    if (!shop) {
      throw new BadRequestException({
        code: 'SHOP_004',
        message: 'Shop not set up. Please create your shop first.',
      });
    }
    return shop;
  }

  /** Non-throwing variant — returns the caller's shop or null (no SHOP_004). */
  async findShopByUserIdOrNull(userId: number): Promise<Shop | null> {
    return this.shopRepository.findByUserId(userId);
  }

  assertShopIsActive(shop: Shop): void {
    if (shop.status !== ShopStatus.Active) {
      throw new ForbiddenException({
        code: 'SHOP_005',
        message: 'Shop is not active',
        status: shop.status,
      });
    }
  }

  // ─── Public ───

  async findActiveShops(query: IShopFilter): Promise<IPaginatedResult<Shop>> {
    return this.shopRepository.findActivePaginated(query);
  }

  async suggestShops(
    query: string,
    limit: number,
  ): Promise<{ name: string; slug: string; logo_url: string | null }[]> {
    return this.shopRepository.suggestShops(query, limit);
  }

  async findShopBySlug(slug: string) {
    const result = await this.shopRepository.findBySlugWithStats(slug);
    if (!result) {
      throw new NotFoundException({
        code: 'SHOP_001',
        message: 'Shop not found',
      });
    }
    const { shop, productCount, avgRating, totalSales } = result;
    return {
      ...shop,
      product_count: productCount,
      average_rating: avgRating,
      total_sales: totalSales,
    };
  }

  async findShopProducts(slug: string, query: IShopFilter) {
    const shop = await this.shopRepository.findBySlug(slug);
    if (!shop) {
      throw new NotFoundException({
        code: 'SHOP_001',
        message: 'Shop not found',
      });
    }
    return this.shopRepository.findActiveProductsByShopId(shop.id, query);
  }

  // ─── Seller ───

  async getMyShop(userId: number): Promise<Shop> {
    return this.resolveShopByUserId(userId);
  }

  async createShop(userId: number, dto: CreateShopDto): Promise<Shop> {
    let slug = generateSlug(dto.name);
    const slugExists = await this.shopRepository.existsBySlug(slug);
    if (slugExists) {
      let suffix = 1;
      while (await this.shopRepository.existsBySlug(`${slug}-${suffix}`)) {
        suffix++;
      }
      slug = `${slug}-${suffix}`;
    }

    try {
      const shop = await this.shopRepository.create({
        user_id: userId,
        name: dto.name,
        slug,
        description: dto.description ?? null,
        logo_url: dto.logo_url ?? null,
        banner_url: dto.banner_url ?? null,
        status: ShopStatus.PendingVerification,
      });
      this.logger.log(
        `Shop created: ${shop.name} (${shop.slug}) by user ${userId}`,
      );
      return shop;
    } catch (error: any) {
      if (error?.number === 2627 || error?.number === 2601) {
        throw new ConflictException({
          code: 'SHOP_002',
          message: 'Shop already exists for this user',
        });
      }
      throw error;
    }
  }

  async updateMyShop(userId: number, dto: UpdateShopDto): Promise<Shop> {
    const shop = await this.resolveShopByUserId(userId);
    const updated = await this.shopRepository.update(shop.id, dto);
    this.logger.log(`Shop updated: ${shop.id} by user ${userId}`);
    return updated!;
  }

  // ─── Admin ───

  async findAllShops(query: IShopFilter): Promise<IPaginatedResult<Shop>> {
    return this.shopRepository.findAllPaginated(query);
  }

  async findShopById(id: number): Promise<Shop> {
    const shop = await this.shopRepository.findById(id);
    if (!shop) {
      throw new NotFoundException({
        code: 'SHOP_001',
        message: 'Shop not found',
      });
    }
    return shop;
  }

  async updateShopStatus(
    id: number,
    newStatus: ShopStatus,
    adminUserId: number,
  ): Promise<Shop> {
    const shop = await this.findShopById(id);

    const updateData: Partial<Shop> = { status: newStatus };

    if (newStatus === ShopStatus.Active && !shop.verified_at) {
      updateData.verified_at = new Date();
      updateData.verified_by = adminUserId;
    }
    if (newStatus === ShopStatus.Suspended) {
      updateData.suspended_at = new Date();
    }
    if (newStatus === ShopStatus.Banned) {
      updateData.banned_at = new Date();
    }

    const updated = await this.shopRepository.update(id, updateData);
    this.logger.log(
      `Shop ${id} status changed to ${newStatus} by admin ${adminUserId}`,
    );
    return updated!;
  }
}
