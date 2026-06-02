import {
  BadRequestException,
  ConflictException,
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
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';
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

    const applicableTotal = await this.getApplicableTotal(coupon, cartItems);

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
    };
  }

  async recordUsage(
    couponId: number,
    userId: number,
    orderId: number,
    discountAmount: number,
    manager: EntityManager,
  ): Promise<void> {
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

  async reverseCouponUsage(orderId: number): Promise<void> {
    const usage = await this.couponUsageRepository.findByOrderId(orderId);

    if (!usage) return;

    await this.couponUsageRepository.updateStatus(
      usage.id,
      CouponUsageStatus.Reversed,
    );
    await this.couponRepository.decrementUsage(usage.coupon_id);

    this.logger.log(
      `Coupon usage reversed: usage=${usage.id}, coupon=${usage.coupon_id}, order=${orderId}`,
    );
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

  // ─── Private helpers ───

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

  private async getApplicableTotal(
    coupon: Coupon,
    cartItems: CartItem[],
  ): Promise<number> {
    if (coupon.scope === CouponScope.All) {
      return cartItems.reduce((sum, item) => {
        const price = Number(item.product_variant.sale_price ?? item.product_variant.price);
        return sum + price * item.quantity;
      }, 0);
    }

    if (coupon.scope === CouponScope.Products) {
      const productIds = new Set(
        (coupon.coupon_products || []).map((cp) => cp.product_id),
      );
      return cartItems
        .filter((item) => productIds.has(item.product_variant.product_id))
        .reduce((sum, item) => {
          const price = Number(item.product_variant.sale_price ?? item.product_variant.price);
          return sum + price * item.quantity;
        }, 0);
    }

    if (coupon.scope === CouponScope.Categories) {
      const baseCategoryIds = (coupon.coupon_categories || []).map(
        (cc) => cc.category_id,
      );
      const allCategoryIds =
        await this.getDescendantCategoryIds(baseCategoryIds);
      const categoryIdSet = new Set(allCategoryIds);

      return cartItems
        .filter((item) => {
          const categoryId = item.product_variant.product?.category_id;
          return categoryId != null && categoryIdSet.has(categoryId);
        })
        .reduce((sum, item) => {
          const price = Number(item.product_variant.sale_price ?? item.product_variant.price);
          return sum + price * item.quantity;
        }, 0);
    }

    return 0;
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
