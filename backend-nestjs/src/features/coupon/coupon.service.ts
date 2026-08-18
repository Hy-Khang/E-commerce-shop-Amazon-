import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, In, Repository } from 'typeorm';
import { CouponRepository } from './repositories/coupon.repository';
import { CouponUsageRepository } from './repositories/coupon-usage.repository';
import { Coupon } from './entities/coupon.entity';
import { CouponCategory } from './entities/coupon-category.entity';
import { CouponProduct } from './entities/coupon-product.entity';
import { Category } from '../product/entities/category.entity';
import { Product } from '../product/entities/product.entity';
import { ShopService } from '../shop/shop.service';
import { Shop } from '../shop/entities/shop.entity';
import { ShopStatus } from '../../common/constants';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';
import { CreateSellerCouponDto } from './dto/create-seller-coupon.dto';
import { UpdateSellerCouponDto } from './dto/update-seller-coupon.dto';
import { CouponQueryDto, CouponUsageQueryDto } from './dto/coupon-query.dto';
import {
  CouponResponseDto,
  CouponUsageResponseDto,
  CouponValidationResponseDto,
} from './dto/coupon-response.dto';
import {
  CouponScope,
  CouponUsageStatus,
  IDiscountCalculation,
} from './types/coupon.types';
import {
  calculateDiscount,
  toCouponResponse,
  toCouponUsageResponse,
  toCouponValidationResponse,
} from './utils/coupon.util';
import { IPaginatedResult } from '../../common/interfaces/paginated-result.interface';
import { CartItem } from '../cart/entities/cart-item.entity';

@Injectable()
export class CouponService {
  private readonly logger = new Logger(CouponService.name);

  constructor(
    private readonly couponRepository: CouponRepository,
    private readonly couponUsageRepository: CouponUsageRepository,
    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    private readonly shopService: ShopService,
  ) {}

  // ─── Customer ───

  async validateCouponForUser(
    userId: number,
    code: string,
  ): Promise<CouponValidationResponseDto> {
    const coupon = await this.validateCoupon(userId, code);
    return toCouponValidationResponse(coupon);
  }

  // ─── Cross-feature: consumed by OrderService ───

  async validateAndCalculateDiscount(
    userId: number,
    code: string,
    cartItems: CartItem[],
  ): Promise<IDiscountCalculation> {
    const coupon = await this.validateCoupon(userId, code);

    const applicableByShop = await this.getApplicableTotalsByShop(
      coupon,
      cartItems,
    );
    const applicableTotal = [...applicableByShop.values()].reduce(
      (sum, v) => sum + v,
      0,
    );

    if (applicableTotal === 0) {
      throw new BadRequestException({
        code: 'COUPON_008',
        message: 'No items in cart are applicable for this coupon',
      });
    }

    if (
      coupon.min_order_amount != null &&
      applicableTotal < Number(coupon.min_order_amount)
    ) {
      throw new BadRequestException({
        code: 'COUPON_005',
        message: `Applicable items total must be at least ${Number(coupon.min_order_amount)} VND`,
      });
    }

    const discountAmount = calculateDiscount(coupon, applicableTotal);

    return {
      coupon_id: coupon.id,
      coupon_code: coupon.code,
      discount_amount: discountAmount,
      coupon_shop_id: coupon.shop_id ?? null,
      applicable_by_shop: Object.fromEntries(applicableByShop),
    };
  }

  async recordUsage(
    couponId: number,
    userId: number,
    orderId: number,
    discountAmount: number,
    manager: EntityManager,
    incrementGlobalCount: boolean = true,
  ): Promise<void> {
    if (incrementGlobalCount) {
      const success = await this.couponRepository.incrementUsage(
        couponId,
        manager,
      );

      if (!success) {
        throw new BadRequestException({
          code: 'COUPON_003',
          message: 'Coupon usage limit has been exceeded',
        });
      }
    }

    await this.couponUsageRepository.createUsage(
      {
        coupon_id: couponId,
        user_id: userId,
        order_id: orderId,
        discount_amount: discountAmount,
        status: CouponUsageStatus.Applied,
      },
      manager,
    );

    this.logger.log(
      `Coupon usage recorded: coupon=${couponId}, user=${userId}, order=${orderId}, discount=${discountAmount}`,
    );
  }

  /**
   * Reverse shop-coupon usages tied to a single (cancelled) sub-order.
   * A shop coupon only ever discounts its own shop's sub-order, so it can be
   * reversed the moment that sub-order is cancelled. Idempotent: a usage is
   * only flipped/decremented if it is still `applied`.
   */
  async reverseOrderShopCoupons(orderId: number): Promise<void> {
    const usages =
      await this.couponUsageRepository.findAppliedByOrderIdWithCoupon(orderId);

    for (const usage of usages) {
      // platform-coupon usages are handled by reverseGroupPlatformCoupon
      if (usage.coupon?.shop_id == null) continue;

      const flipped = await this.couponUsageRepository.reverseIfApplied(
        usage.id,
      );
      if (flipped) {
        await this.couponRepository.decrementUsage(usage.coupon_id);
        this.logger.log(
          `Shop coupon usage reversed: usage=${usage.id}, coupon=${usage.coupon_id}, order=${orderId}`,
        );
      }
    }
  }

  /**
   * Reverse platform-coupon usage for a group. A platform coupon spans the
   * whole checkout (one usage row per sub-order, one global count), so it is
   * only reversed once ALL orders in the group are cancelled. Global count is
   * decremented once per coupon, only if at least one row was actually flipped.
   * Idempotent: calling again is a no-op.
   */
  async reverseGroupPlatformCoupon(orderGroupId: string): Promise<void> {
    const usages =
      await this.couponUsageRepository.findActiveByGroupIdWithCoupon(
        orderGroupId,
      );

    const platformUsages = usages.filter((u) => u.coupon?.shop_id == null);
    if (platformUsages.length === 0) return;

    const couponIds = new Set(platformUsages.map((u) => u.coupon_id));

    for (const couponId of couponIds) {
      let flippedAny = false;
      for (const usage of platformUsages.filter(
        (u) => u.coupon_id === couponId,
      )) {
        const flipped = await this.couponUsageRepository.reverseIfApplied(
          usage.id,
        );
        if (flipped) flippedAny = true;
      }
      if (flippedAny) {
        await this.couponRepository.decrementUsage(couponId);
        this.logger.log(
          `Platform coupon usage reversed: group=${orderGroupId}, coupon=${couponId}`,
        );
      }
    }
  }

  // ─── Admin CRUD ───

  async createCoupon(dto: CreateCouponDto): Promise<CouponResponseDto> {
    const exists = await this.couponRepository.existsByCode(dto.code);
    if (exists) {
      throw new ConflictException({
        code: 'COUPON_007',
        message: 'Coupon code already exists',
      });
    }

    const coupon = await this.couponRepository.create({
      code: dto.code,
      description: dto.description,
      discount_type: dto.discount_type,
      discount_value: dto.discount_value,
      scope: dto.scope || CouponScope.All,
      min_order_amount: dto.min_order_amount,
      max_discount_amount: dto.max_discount_amount,
      max_uses: dto.max_uses,
      max_uses_per_user: dto.max_uses_per_user ?? 1,
      starts_at: new Date(dto.starts_at),
      expires_at: new Date(dto.expires_at),
    });

    if (dto.scope === CouponScope.Categories && dto.category_ids?.length) {
      await this.saveCouponCategories(coupon.id, dto.category_ids);
    }

    if (dto.scope === CouponScope.Products && dto.product_ids?.length) {
      await this.saveCouponProducts(coupon.id, dto.product_ids);
    }

    const saved = await this.couponRepository.findById(coupon.id);
    this.logger.log(`Coupon created: ${coupon.code} (id=${coupon.id})`);

    return toCouponResponse(saved!);
  }

  async updateCoupon(
    id: number,
    dto: UpdateCouponDto,
  ): Promise<CouponResponseDto> {
    const coupon = await this.couponRepository.findById(id);
    if (!coupon) {
      throw new NotFoundException({
        code: 'COUPON_001',
        message: 'Coupon not found',
      });
    }

    // Admins may view and deactivate shop coupons (moderation) but not edit
    // their content — that is the owning seller's responsibility.
    if (coupon.shop_id != null) {
      throw new ForbiddenException({
        code: 'COUPON_010',
        message: 'Shop coupons can only be edited by their owning seller',
      });
    }

    const updateData: Partial<Coupon> = {};
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.discount_type !== undefined)
      updateData.discount_type = dto.discount_type;
    if (dto.discount_value !== undefined)
      updateData.discount_value = dto.discount_value;
    if (dto.scope !== undefined) updateData.scope = dto.scope;
    if (dto.min_order_amount !== undefined)
      updateData.min_order_amount = dto.min_order_amount;
    if (dto.max_discount_amount !== undefined)
      updateData.max_discount_amount = dto.max_discount_amount;
    if (dto.max_uses !== undefined) updateData.max_uses = dto.max_uses;
    if (dto.max_uses_per_user !== undefined)
      updateData.max_uses_per_user = dto.max_uses_per_user;
    if (dto.starts_at !== undefined)
      updateData.starts_at = new Date(dto.starts_at);
    if (dto.expires_at !== undefined)
      updateData.expires_at = new Date(dto.expires_at);
    if (dto.is_active !== undefined) updateData.is_active = dto.is_active;
    updateData.updated_at = new Date();

    await this.couponRepository.update(id, updateData);

    const newScope = dto.scope ?? coupon.scope;

    if (dto.category_ids !== undefined) {
      await this.replaceCouponCategories(id, dto.category_ids);
    }

    if (dto.product_ids !== undefined) {
      await this.replaceCouponProducts(id, dto.product_ids);
    }

    if (
      dto.scope !== undefined &&
      dto.scope !== coupon.scope
    ) {
      if (newScope !== CouponScope.Categories) {
        await this.replaceCouponCategories(id, []);
      }
      if (newScope !== CouponScope.Products) {
        await this.replaceCouponProducts(id, []);
      }
    }

    const updated = await this.couponRepository.findById(id);
    this.logger.log(`Coupon updated: id=${id}`);

    return toCouponResponse(updated!);
  }

  async findCouponById(id: number): Promise<CouponResponseDto> {
    const coupon = await this.couponRepository.findById(id);
    if (!coupon) {
      throw new NotFoundException({
        code: 'COUPON_001',
        message: 'Coupon not found',
      });
    }
    return toCouponResponse(coupon);
  }

  async findAllCoupons(
    query: CouponQueryDto,
  ): Promise<IPaginatedResult<CouponResponseDto>> {
    const result = await this.couponRepository.findAllPaginated(query);

    return {
      data: result.data.map(toCouponResponse),
      meta: result.meta,
    };
  }

  async deactivateCoupon(id: number): Promise<void> {
    const coupon = await this.couponRepository.findById(id);
    if (!coupon) {
      throw new NotFoundException({
        code: 'COUPON_001',
        message: 'Coupon not found',
      });
    }

    await this.couponRepository.update(id, {
      is_active: false,
      updated_at: new Date(),
    });

    this.logger.log(`Coupon deactivated: ${coupon.code} (id=${id})`);
  }

  async findCouponUsages(
    couponId: number,
    page: number,
    limit: number,
  ): Promise<IPaginatedResult<CouponUsageResponseDto>> {
    const coupon = await this.couponRepository.findById(couponId);
    if (!coupon) {
      throw new NotFoundException({
        code: 'COUPON_001',
        message: 'Coupon not found',
      });
    }

    const result = await this.couponUsageRepository.findByCouponIdPaginated(
      couponId,
      page,
      limit,
    );

    return {
      data: result.data.map(toCouponUsageResponse),
      meta: result.meta,
    };
  }

  async findAllUsages(
    query: CouponUsageQueryDto,
  ): Promise<IPaginatedResult<CouponUsageResponseDto>> {
    const result = await this.couponUsageRepository.findAllPaginated(query);

    return {
      data: result.data.map(toCouponUsageResponse),
      meta: result.meta,
    };
  }

  // ─── Seller CRUD (shop-scoped) ───

  async findSellerCoupons(
    userId: number,
    query: CouponQueryDto,
  ): Promise<IPaginatedResult<CouponResponseDto>> {
    const shop = await this.shopService.resolveShopByUserId(userId);
    const result = await this.couponRepository.findAllPaginated(query, {
      forceShopId: shop.id,
    });

    return {
      data: result.data.map(toCouponResponse),
      meta: result.meta,
    };
  }

  async findSellerCouponById(
    userId: number,
    id: number,
  ): Promise<CouponResponseDto> {
    const { coupon } = await this.assertSellerOwnsCoupon(userId, id);
    return toCouponResponse(coupon);
  }

  async createSellerCoupon(
    userId: number,
    dto: CreateSellerCouponDto,
  ): Promise<CouponResponseDto> {
    const shop = await this.shopService.resolveShopByUserId(userId);

    const code = `${shop.slug}-${dto.code}`.toUpperCase().trim();
    if (code.length > 50) {
      throw new BadRequestException({
        code: 'COUPON_012',
        message:
          'Generated coupon code exceeds 50 characters; please use a shorter code',
      });
    }

    const exists = await this.couponRepository.existsByCode(code);
    if (exists) {
      throw new ConflictException({
        code: 'COUPON_007',
        message: 'Coupon code already exists',
      });
    }

    const scope = dto.scope || CouponScope.All;
    if (scope === CouponScope.Products && dto.product_ids?.length) {
      await this.assertProductsBelongToShop(dto.product_ids, shop.id);
    }

    let coupon: Coupon;
    try {
      coupon = await this.couponRepository.create({
        code,
        shop_id: shop.id,
        description: dto.description,
        discount_type: dto.discount_type,
        discount_value: dto.discount_value,
        scope,
        min_order_amount: dto.min_order_amount,
        max_discount_amount: dto.max_discount_amount,
        max_uses: dto.max_uses,
        max_uses_per_user: dto.max_uses_per_user ?? 1,
        starts_at: new Date(dto.starts_at),
        expires_at: new Date(dto.expires_at),
      });
    } catch (error: any) {
      if (error?.number === 2627 || error?.number === 2601) {
        throw new ConflictException({
          code: 'COUPON_007',
          message: 'Coupon code already exists',
        });
      }
      throw error;
    }

    if (scope === CouponScope.Products && dto.product_ids?.length) {
      await this.saveCouponProducts(coupon.id, dto.product_ids);
    }

    const saved = await this.couponRepository.findById(coupon.id);
    this.logger.log(
      `Shop coupon created: ${coupon.code} (id=${coupon.id}, shop=${shop.id})`,
    );

    return toCouponResponse(saved!);
  }

  async updateSellerCoupon(
    userId: number,
    id: number,
    dto: UpdateSellerCouponDto,
  ): Promise<CouponResponseDto> {
    const { shop, coupon } = await this.assertSellerOwnsCoupon(userId, id);

    const newScope = dto.scope ?? coupon.scope;
    if (
      newScope === CouponScope.Products &&
      dto.product_ids !== undefined &&
      dto.product_ids.length
    ) {
      await this.assertProductsBelongToShop(dto.product_ids, shop.id);
    }

    const updateData: Partial<Coupon> = {};
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.discount_type !== undefined)
      updateData.discount_type = dto.discount_type;
    if (dto.discount_value !== undefined)
      updateData.discount_value = dto.discount_value;
    if (dto.scope !== undefined) updateData.scope = dto.scope;
    if (dto.min_order_amount !== undefined)
      updateData.min_order_amount = dto.min_order_amount;
    if (dto.max_discount_amount !== undefined)
      updateData.max_discount_amount = dto.max_discount_amount;
    if (dto.max_uses !== undefined) updateData.max_uses = dto.max_uses;
    if (dto.max_uses_per_user !== undefined)
      updateData.max_uses_per_user = dto.max_uses_per_user;
    if (dto.starts_at !== undefined)
      updateData.starts_at = new Date(dto.starts_at);
    if (dto.expires_at !== undefined)
      updateData.expires_at = new Date(dto.expires_at);
    if (dto.is_active !== undefined) updateData.is_active = dto.is_active;
    updateData.updated_at = new Date();

    await this.couponRepository.update(id, updateData);

    if (dto.product_ids !== undefined) {
      await this.replaceCouponProducts(id, dto.product_ids);
    }
    // scope changed away from products → clear product links
    if (
      dto.scope !== undefined &&
      dto.scope !== coupon.scope &&
      newScope !== CouponScope.Products
    ) {
      await this.replaceCouponProducts(id, []);
    }

    const updated = await this.couponRepository.findById(id);
    this.logger.log(`Shop coupon updated: id=${id}, shop=${shop.id}`);

    return toCouponResponse(updated!);
  }

  async deactivateSellerCoupon(userId: number, id: number): Promise<void> {
    await this.assertSellerOwnsCoupon(userId, id);
    await this.couponRepository.update(id, {
      is_active: false,
      updated_at: new Date(),
    });
    this.logger.log(`Shop coupon deactivated: id=${id}`);
  }

  async findSellerCouponUsages(
    userId: number,
    couponId: number,
    page: number,
    limit: number,
  ): Promise<IPaginatedResult<CouponUsageResponseDto>> {
    await this.assertSellerOwnsCoupon(userId, couponId);

    const result = await this.couponUsageRepository.findByCouponIdPaginated(
      couponId,
      page,
      limit,
    );

    return {
      data: result.data.map(toCouponUsageResponse),
      meta: result.meta,
    };
  }

  // ─── Private helpers ───

  /**
   * Resolves the caller's shop and asserts the coupon is owned by it.
   * Rejects platform coupons and coupons of other shops with COUPON_010.
   */
  private async assertSellerOwnsCoupon(
    userId: number,
    couponId: number,
  ): Promise<{ shop: Shop; coupon: Coupon }> {
    const shop = await this.shopService.resolveShopByUserId(userId);
    const coupon = await this.couponRepository.findById(couponId);

    if (!coupon || coupon.shop_id == null || coupon.shop_id !== shop.id) {
      throw new ForbiddenException({
        code: 'COUPON_010',
        message: 'You do not have access to this coupon',
      });
    }

    return { shop, coupon };
  }

  private async assertProductsBelongToShop(
    productIds: number[],
    shopId: number,
  ): Promise<void> {
    const uniqueIds = [...new Set(productIds)];
    const count = await this.productRepo.count({
      where: { id: In(uniqueIds), shop_id: shopId },
    });
    if (count !== uniqueIds.length) {
      throw new BadRequestException({
        code: 'COUPON_009',
        message: 'One or more products do not belong to your shop',
      });
    }
  }

  private async validateCoupon(userId: number, code: string): Promise<Coupon> {
    const coupon = await this.couponRepository.findByCode(code.toUpperCase());
    if (!coupon) {
      throw new NotFoundException({
        code: 'COUPON_001',
        message: 'Coupon not found',
      });
    }

    if (!coupon.is_active) {
      throw new BadRequestException({
        code: 'COUPON_006',
        message: 'Coupon is not currently active',
      });
    }

    // Shop coupons are only usable while the owning shop is active.
    if (coupon.shop_id != null) {
      const shop = await this.shopService
        .findShopById(coupon.shop_id)
        .catch(() => null);
      if (!shop || shop.status !== ShopStatus.Active) {
        throw new BadRequestException({
          code: 'COUPON_006',
          message: 'Coupon is not currently active',
        });
      }
    }

    const now = new Date();
    if (now < coupon.starts_at || now > coupon.expires_at) {
      throw new BadRequestException({
        code: 'COUPON_002',
        message: 'Coupon has expired or is not yet active',
      });
    }

    if (coupon.max_uses != null && coupon.current_uses >= coupon.max_uses) {
      throw new BadRequestException({
        code: 'COUPON_003',
        message: 'Coupon usage limit has been exceeded',
      });
    }

    const userUsageCount =
      await this.couponUsageRepository.countActiveByUserAndCoupon(
        userId,
        coupon.id,
      );
    if (userUsageCount >= coupon.max_uses_per_user) {
      throw new BadRequestException({
        code: 'COUPON_004',
        message: 'You have already used this coupon the maximum number of times',
      });
    }

    return coupon;
  }

  /**
   * Applicable subtotal grouped by shop id, honouring both the coupon scope
   * (all / products / categories) and — for shop coupons — the owning shop
   * (only that shop's items count). Returns Map<shopId, applicableSubtotal>.
   */
  private async getApplicableTotalsByShop(
    coupon: Coupon,
    cartItems: CartItem[],
  ): Promise<Map<number, number>> {
    const productIdSet =
      coupon.scope === CouponScope.Products
        ? new Set((coupon.coupon_products || []).map((cp) => cp.product_id))
        : null;

    let categoryIdSet: Set<number> | null = null;
    if (coupon.scope === CouponScope.Categories) {
      const baseCategoryIds = (coupon.coupon_categories || []).map(
        (cc) => cc.category_id,
      );
      categoryIdSet = new Set(
        await this.getDescendantCategoryIds(baseCategoryIds),
      );
    }

    const totals = new Map<number, number>();

    for (const item of cartItems) {
      const variant = item.product_variant;
      const product = variant.product;
      const shopId = product?.shop_id;
      if (shopId == null) continue;

      // shop coupon: only its own shop's items are applicable
      if (coupon.shop_id != null && shopId !== coupon.shop_id) continue;

      // scope filter
      if (
        coupon.scope === CouponScope.Products &&
        !productIdSet!.has(variant.product_id)
      ) {
        continue;
      }
      if (coupon.scope === CouponScope.Categories) {
        const categoryId = product?.category_id;
        if (categoryId == null || !categoryIdSet!.has(categoryId)) continue;
      }

      const price = Number(variant.sale_price ?? variant.price);
      const line = price * item.quantity;
      totals.set(shopId, (totals.get(shopId) ?? 0) + line);
    }

    return totals;
  }

  private async getDescendantCategoryIds(
    categoryIds: number[],
  ): Promise<number[]> {
    if (categoryIds.length === 0) return [];

    const allIds = new Set(categoryIds);
    let currentLevel = categoryIds;

    while (currentLevel.length > 0) {
      const children = await this.categoryRepo.find({
        where: { parent_id: In(currentLevel) },
        select: ['id'],
      });

      currentLevel = [];
      for (const child of children) {
        if (!allIds.has(child.id)) {
          allIds.add(child.id);
          currentLevel.push(child.id);
        }
      }
    }

    return Array.from(allIds);
  }

  private async saveCouponCategories(
    couponId: number,
    categoryIds: number[],
  ): Promise<void> {
    const entities = categoryIds.map((categoryId) => {
      const cc = new CouponCategory();
      cc.coupon_id = couponId;
      cc.category_id = categoryId;
      return cc;
    });
    await this.categoryRepo.manager.save(CouponCategory, entities);
  }

  private async saveCouponProducts(
    couponId: number,
    productIds: number[],
  ): Promise<void> {
    const entities = productIds.map((productId) => {
      const cp = new CouponProduct();
      cp.coupon_id = couponId;
      cp.product_id = productId;
      return cp;
    });
    await this.categoryRepo.manager.save(CouponProduct, entities);
  }

  private async replaceCouponCategories(
    couponId: number,
    categoryIds: number[],
  ): Promise<void> {
    await this.categoryRepo.manager.delete(CouponCategory, {
      coupon_id: couponId,
    });
    if (categoryIds.length > 0) {
      await this.saveCouponCategories(couponId, categoryIds);
    }
  }

  private async replaceCouponProducts(
    couponId: number,
    productIds: number[],
  ): Promise<void> {
    await this.categoryRepo.manager.delete(CouponProduct, {
      coupon_id: couponId,
    });
    if (productIds.length > 0) {
      await this.saveCouponProducts(couponId, productIds);
    }
  }
}
