import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { CouponService } from '../coupon.service';
import { CouponRepository } from '../repositories/coupon.repository';
import { CouponUsageRepository } from '../repositories/coupon-usage.repository';
import { Category } from '../../product/entities/category.entity';
import { Product } from '../../product/entities/product.entity';
import { ShopService } from '../../shop/shop.service';
import { CartService } from '../../cart/cart.service';
import { CartEmptyException } from '../../../common/exceptions/cart-empty.exception';
import { CouponScope, DiscountType } from '../types/coupon.types';
import { ShopStatus } from '../../../common/constants';

// ─── Builders ───

function buildCoupon(overrides: Partial<any> = {}): any {
  const now = Date.now();
  return {
    id: 1,
    code: 'SALE',
    shop_id: null,
    description: null,
    discount_type: DiscountType.Fixed,
    discount_value: 50000,
    scope: CouponScope.All,
    min_order_amount: null,
    max_discount_amount: null,
    max_uses: null,
    max_uses_per_user: 1,
    current_uses: 0,
    starts_at: new Date(now - 86_400_000),
    expires_at: new Date(now + 86_400_000),
    is_active: true,
    admin_disabled: false,
    coupon_categories: [],
    coupon_products: [],
    ...overrides,
  };
}

function cartItem(
  shopId: number,
  price: number,
  quantity = 1,
  opts: { productId?: number; categoryId?: number; salePrice?: number | null } = {},
): any {
  return {
    quantity,
    product_variant: {
      product_id: opts.productId ?? shopId * 10,
      price,
      sale_price: opts.salePrice ?? null,
      product: {
        shop_id: shopId,
        category_id: opts.categoryId ?? shopId,
      },
    },
  };
}

describe('CouponService', () => {
  let service: CouponService;
  let couponRepo: any;
  let usageRepo: any;
  let categoryRepo: any;
  let productRepo: any;
  let shopService: any;
  let cartService: any;

  beforeEach(async () => {
    jest.clearAllMocks();

    couponRepo = {
      findByCode: jest.fn(),
      findById: jest.fn(),
      findAllPaginated: jest.fn(),
      findAvailableForCart: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      incrementUsage: jest.fn(),
      decrementUsage: jest.fn(),
      existsByCode: jest.fn(),
    };
    usageRepo = {
      countActiveByUserAndCoupon: jest.fn().mockResolvedValue(0),
      createUsage: jest.fn(),
      findAppliedByOrderIdWithCoupon: jest.fn(),
      findActiveByGroupIdWithCoupon: jest.fn(),
      reverseIfApplied: jest.fn(),
      findByCouponIdPaginated: jest.fn(),
    };
    categoryRepo = {
      find: jest.fn().mockResolvedValue([]),
      manager: { save: jest.fn(), delete: jest.fn() },
    };
    productRepo = { count: jest.fn() };
    shopService = {
      resolveShopByUserId: jest.fn(),
      findShopById: jest.fn(),
    };
    cartService = {
      getCartWithItems: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CouponService,
        { provide: CouponRepository, useValue: couponRepo },
        { provide: CouponUsageRepository, useValue: usageRepo },
        { provide: getRepositoryToken(Category), useValue: categoryRepo },
        { provide: getRepositoryToken(Product), useValue: productRepo },
        { provide: ShopService, useValue: shopService },
        { provide: CartService, useValue: cartService },
      ],
    }).compile();

    service = module.get(CouponService);
  });

  // ─── validateCoupon (via validateCouponForUser) ───

  describe('validateCoupon', () => {
    it('rejects a missing coupon with COUPON_001', async () => {
      couponRepo.findByCode.mockResolvedValue(null);
      await expect(service.validateCouponForUser(1, 'NOPE')).rejects.toMatchObject({
        response: { code: 'COUPON_001' },
      });
    });

    it('rejects an inactive coupon with COUPON_006', async () => {
      couponRepo.findByCode.mockResolvedValue(buildCoupon({ is_active: false }));
      await expect(service.validateCouponForUser(1, 'SALE')).rejects.toMatchObject({
        response: { code: 'COUPON_006' },
      });
    });

    it('rejects an admin-locked coupon with COUPON_006', async () => {
      couponRepo.findByCode.mockResolvedValue(
        buildCoupon({ shop_id: 5, admin_disabled: true }),
      );
      await expect(service.validateCouponForUser(1, 'SALE')).rejects.toMatchObject({
        response: { code: 'COUPON_006' },
      });
    });

    it('rejects a shop coupon whose shop is not active with COUPON_006', async () => {
      couponRepo.findByCode.mockResolvedValue(buildCoupon({ shop_id: 5 }));
      shopService.findShopById.mockResolvedValue({
        id: 5,
        status: ShopStatus.Suspended,
      });
      await expect(service.validateCouponForUser(1, 'SALE')).rejects.toMatchObject({
        response: { code: 'COUPON_006' },
      });
    });

    it('rejects an expired coupon with COUPON_002', async () => {
      couponRepo.findByCode.mockResolvedValue(
        buildCoupon({ expires_at: new Date(Date.now() - 1000) }),
      );
      await expect(service.validateCouponForUser(1, 'SALE')).rejects.toMatchObject({
        response: { code: 'COUPON_002' },
      });
    });

    it('rejects when global usage limit reached with COUPON_003', async () => {
      couponRepo.findByCode.mockResolvedValue(
        buildCoupon({ max_uses: 5, current_uses: 5 }),
      );
      await expect(service.validateCouponForUser(1, 'SALE')).rejects.toMatchObject({
        response: { code: 'COUPON_003' },
      });
    });

    it('rejects when per-user limit reached with COUPON_004', async () => {
      couponRepo.findByCode.mockResolvedValue(buildCoupon({ max_uses_per_user: 1 }));
      usageRepo.countActiveByUserAndCoupon.mockResolvedValue(1);
      await expect(service.validateCouponForUser(1, 'SALE')).rejects.toMatchObject({
        response: { code: 'COUPON_004' },
      });
    });

    it('accepts an active shop coupon while its shop is active', async () => {
      couponRepo.findByCode.mockResolvedValue(buildCoupon({ shop_id: 5 }));
      shopService.findShopById.mockResolvedValue({ id: 5, status: ShopStatus.Active });
      const res = await service.validateCouponForUser(1, 'SALE');
      expect(res.valid).toBe(true);
      expect(res.shop_id).toBe(5);
    });
  });

  // ─── validateAndCalculateDiscounts (multi-coupon) ───

  describe('validateAndCalculateDiscounts', () => {
    it('returns [] when no codes given', async () => {
      const res = await service.validateAndCalculateDiscounts(1, [], []);
      expect(res).toEqual([]);
      expect(couponRepo.findByCode).not.toHaveBeenCalled();
    });

    it('calculates a platform coupon across shops (applicable_by_shop)', async () => {
      couponRepo.findByCode.mockResolvedValue(
        buildCoupon({ code: 'PLAT', discount_type: DiscountType.Fixed, discount_value: 40000 }),
      );
      const cart = [cartItem(1, 100000), cartItem(2, 300000)];

      const res = await service.validateAndCalculateDiscounts(1, ['PLAT'], cart);

      expect(res).toHaveLength(1);
      expect(res[0].coupon_shop_id).toBeNull();
      expect(res[0].discount_amount).toBe(40000);
      expect(res[0].applicable_by_shop).toEqual({ 1: 100000, 2: 300000 });
    });

    it('confines a shop coupon to its own shop items', async () => {
      couponRepo.findByCode.mockResolvedValue(
        buildCoupon({ code: 'SHOP1', shop_id: 1, discount_value: 20000 }),
      );
      shopService.findShopById.mockResolvedValue({ id: 1, status: ShopStatus.Active });
      const cart = [cartItem(1, 100000), cartItem(2, 300000)];

      const res = await service.validateAndCalculateDiscounts(1, ['SHOP1'], cart);

      expect(res[0].coupon_shop_id).toBe(1);
      expect(res[0].applicable_by_shop).toEqual({ 1: 100000 });
      expect(res[0].discount_amount).toBe(20000);
    });

    it('rejects two platform coupons with COUPON_011', async () => {
      couponRepo.findByCode.mockImplementation((code: string) =>
        Promise.resolve(buildCoupon({ code, shop_id: null })),
      );
      const cart = [cartItem(1, 100000)];
      await expect(
        service.validateAndCalculateDiscounts(1, ['P1', 'P2'], cart),
      ).rejects.toMatchObject({ response: { code: 'COUPON_011' } });
    });

    it('rejects two coupons for the same shop with COUPON_011', async () => {
      couponRepo.findByCode.mockImplementation((code: string) =>
        Promise.resolve(buildCoupon({ code, shop_id: 1 })),
      );
      shopService.findShopById.mockResolvedValue({ id: 1, status: ShopStatus.Active });
      const cart = [cartItem(1, 100000)];
      await expect(
        service.validateAndCalculateDiscounts(1, ['S1', 'S2'], cart),
      ).rejects.toMatchObject({ response: { code: 'COUPON_011' } });
    });

    it('allows one platform + one shop coupon together', async () => {
      couponRepo.findByCode.mockImplementation((code: string) =>
        Promise.resolve(
          code === 'PLAT'
            ? buildCoupon({ code, shop_id: null, discount_value: 10000 })
            : buildCoupon({ code, shop_id: 1, discount_value: 5000 }),
        ),
      );
      shopService.findShopById.mockResolvedValue({ id: 1, status: ShopStatus.Active });
      const cart = [cartItem(1, 100000), cartItem(2, 200000)];

      const res = await service.validateAndCalculateDiscounts(1, ['PLAT', 'SHOP1'], cart);

      expect(res).toHaveLength(2);
      expect(res.find((c) => c.coupon_shop_id === null)).toBeDefined();
      expect(res.find((c) => c.coupon_shop_id === 1)).toBeDefined();
    });

    it('dedupes repeated codes', async () => {
      couponRepo.findByCode.mockResolvedValue(buildCoupon({ code: 'PLAT' }));
      const cart = [cartItem(1, 100000)];
      const res = await service.validateAndCalculateDiscounts(1, ['plat', 'PLAT'], cart);
      expect(res).toHaveLength(1);
      expect(couponRepo.findByCode).toHaveBeenCalledTimes(1);
    });

    it('rejects when nothing is applicable with COUPON_008', async () => {
      couponRepo.findByCode.mockResolvedValue(
        buildCoupon({ scope: CouponScope.Products, coupon_products: [{ product_id: 999 }] }),
      );
      const cart = [cartItem(1, 100000)]; // product_id 10, not 999
      await expect(
        service.validateAndCalculateDiscounts(1, ['P'], cart),
      ).rejects.toMatchObject({ response: { code: 'COUPON_008' } });
    });

    it('rejects when below min_order_amount with COUPON_005', async () => {
      couponRepo.findByCode.mockResolvedValue(
        buildCoupon({ min_order_amount: 500000 }),
      );
      const cart = [cartItem(1, 100000)];
      await expect(
        service.validateAndCalculateDiscounts(1, ['P'], cart),
      ).rejects.toMatchObject({ response: { code: 'COUPON_005' } });
    });

    it('caps a percentage discount at max_discount_amount', async () => {
      couponRepo.findByCode.mockResolvedValue(
        buildCoupon({
          discount_type: DiscountType.Percentage,
          discount_value: 50,
          max_discount_amount: 30000,
        }),
      );
      const cart = [cartItem(1, 100000)]; // 50% = 50000, capped at 30000
      const res = await service.validateAndCalculateDiscounts(1, ['P'], cart);
      expect(res[0].discount_amount).toBe(30000);
    });
  });

  // ─── Seller CRUD ───

  describe('createSellerCoupon', () => {
    const dtoBase = {
      code: 'SALE10',
      discount_type: DiscountType.Fixed,
      discount_value: 10000,
      scope: CouponScope.All,
      max_uses_per_user: 1,
      starts_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 86_400_000).toISOString(),
    } as any;

    it('prefixes the code with the shop slug (uppercased) and persists shop_id', async () => {
      shopService.resolveShopByUserId.mockResolvedValue({ id: 7, slug: 'my-shop' });
      couponRepo.existsByCode.mockResolvedValue(false);
      couponRepo.create.mockResolvedValue(buildCoupon({ id: 50 }));
      couponRepo.findById.mockResolvedValue(buildCoupon({ id: 50, shop_id: 7, code: 'MY-SHOP-SALE10' }));

      await service.createSellerCoupon(9, dtoBase);

      expect(couponRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ code: 'MY-SHOP-SALE10', shop_id: 7 }),
      );
    });

    it('rejects a generated code longer than 50 chars with COUPON_012', async () => {
      shopService.resolveShopByUserId.mockResolvedValue({
        id: 7,
        slug: 'a-very-long-shop-slug-that-eats-up-the-namespace',
      });
      await expect(
        service.createSellerCoupon(9, { ...dtoBase, code: 'ANOTHERLONGCODE' }),
      ).rejects.toMatchObject({ response: { code: 'COUPON_012' } });
    });

    it('rejects a duplicate code with COUPON_007', async () => {
      shopService.resolveShopByUserId.mockResolvedValue({ id: 7, slug: 'my-shop' });
      couponRepo.existsByCode.mockResolvedValue(true);
      await expect(service.createSellerCoupon(9, dtoBase)).rejects.toBeInstanceOf(
        ConflictException,
      );
    });

    it('rejects products not belonging to the shop with COUPON_009', async () => {
      shopService.resolveShopByUserId.mockResolvedValue({ id: 7, slug: 'my-shop' });
      couponRepo.existsByCode.mockResolvedValue(false);
      productRepo.count.mockResolvedValue(1); // only 1 of 2 products belong
      await expect(
        service.createSellerCoupon(9, {
          ...dtoBase,
          scope: CouponScope.Products,
          product_ids: [1, 2],
        }),
      ).rejects.toMatchObject({ response: { code: 'COUPON_009' } });
    });
  });

  describe('seller ownership (assertSellerOwnsCoupon)', () => {
    it('rejects a platform coupon with COUPON_010', async () => {
      shopService.resolveShopByUserId.mockResolvedValue({ id: 7, slug: 'my-shop' });
      couponRepo.findById.mockResolvedValue(buildCoupon({ id: 3, shop_id: null }));
      await expect(service.findSellerCouponById(9, 3)).rejects.toMatchObject({
        response: { code: 'COUPON_010' },
      });
    });

    it("rejects another shop's coupon with COUPON_010", async () => {
      shopService.resolveShopByUserId.mockResolvedValue({ id: 7, slug: 'my-shop' });
      couponRepo.findById.mockResolvedValue(buildCoupon({ id: 3, shop_id: 8 }));
      await expect(service.findSellerCouponById(9, 3)).rejects.toMatchObject({
        response: { code: 'COUPON_010' },
      });
    });

    it('returns the coupon when owned by the caller shop', async () => {
      shopService.resolveShopByUserId.mockResolvedValue({ id: 7, slug: 'my-shop' });
      couponRepo.findById.mockResolvedValue(buildCoupon({ id: 3, shop_id: 7 }));
      const res = await service.findSellerCouponById(9, 3);
      expect(res.id).toBe(3);
    });
  });

  describe('updateSellerCoupon', () => {
    it('rejects updates on an admin-locked coupon with COUPON_013', async () => {
      shopService.resolveShopByUserId.mockResolvedValue({ id: 7, slug: 'my-shop' });
      couponRepo.findById.mockResolvedValue(
        buildCoupon({ id: 3, shop_id: 7, admin_disabled: true }),
      );
      await expect(
        service.updateSellerCoupon(9, 3, { is_active: true } as any),
      ).rejects.toMatchObject({ response: { code: 'COUPON_013' } });
    });

    it('rejects clearing all products on a products-scoped coupon (dead coupon)', async () => {
      shopService.resolveShopByUserId.mockResolvedValue({ id: 7, slug: 'my-shop' });
      couponRepo.findById.mockResolvedValue(
        buildCoupon({
          id: 3,
          shop_id: 7,
          scope: CouponScope.Products,
          coupon_products: [{ product_id: 1 }],
        }),
      );
      await expect(
        service.updateSellerCoupon(9, 3, { product_ids: [] } as any),
      ).rejects.toMatchObject({ response: { code: 'VALIDATION_001' } });
      expect(couponRepo.update).not.toHaveBeenCalled();
    });
  });

  // ─── Admin lock ───

  describe('deactivateCoupon', () => {
    it('sets the sticky admin lock for a shop coupon', async () => {
      couponRepo.findById.mockResolvedValue(buildCoupon({ id: 3, shop_id: 7 }));
      await service.deactivateCoupon(3);
      expect(couponRepo.update).toHaveBeenCalledWith(
        3,
        expect.objectContaining({ is_active: false, admin_disabled: true }),
      );
    });

    it('does not set the lock for a platform coupon', async () => {
      couponRepo.findById.mockResolvedValue(buildCoupon({ id: 3, shop_id: null }));
      await service.deactivateCoupon(3);
      const patch = couponRepo.update.mock.calls[0][1];
      expect(patch.is_active).toBe(false);
      expect(patch.admin_disabled).toBeUndefined();
    });
  });

  describe('unlockCoupon', () => {
    it('clears only the lock, leaving is_active untouched (unlock ≠ activate)', async () => {
      couponRepo.findById
        .mockResolvedValueOnce(
          buildCoupon({ id: 3, shop_id: 7, admin_disabled: true, is_active: false }),
        )
        .mockResolvedValueOnce(
          buildCoupon({ id: 3, shop_id: 7, admin_disabled: false, is_active: false }),
        );
      await service.unlockCoupon(3);
      const patch = couponRepo.update.mock.calls[0][1];
      expect(patch.admin_disabled).toBe(false);
      expect(patch.is_active).toBeUndefined(); // stays inactive; seller re-enables
    });
  });

  describe('updateCoupon (admin)', () => {
    it('refuses to edit a shop coupon with COUPON_010', async () => {
      couponRepo.findById.mockResolvedValue(buildCoupon({ id: 3, shop_id: 7 }));
      await expect(
        service.updateCoupon(3, { discount_value: 1 } as any),
      ).rejects.toMatchObject({ response: { code: 'COUPON_010' } });
    });
  });

  // ─── Usage & reversal ───

  describe('recordUsage', () => {
    const mgr: any = {};

    it('increments the global count and creates a usage row', async () => {
      couponRepo.incrementUsage.mockResolvedValue(true);
      await service.recordUsage(5, 1, 42, 10000, mgr, true);
      expect(couponRepo.incrementUsage).toHaveBeenCalledWith(5, mgr);
      expect(usageRepo.createUsage).toHaveBeenCalled();
    });

    it('throws COUPON_003 if the atomic increment fails', async () => {
      couponRepo.incrementUsage.mockResolvedValue(false);
      await expect(
        service.recordUsage(5, 1, 42, 10000, mgr, true),
      ).rejects.toMatchObject({ response: { code: 'COUPON_003' } });
      expect(usageRepo.createUsage).not.toHaveBeenCalled();
    });

    it('skips the increment when incrementGlobalCount is false', async () => {
      await service.recordUsage(5, 1, 42, 10000, mgr, false);
      expect(couponRepo.incrementUsage).not.toHaveBeenCalled();
      expect(usageRepo.createUsage).toHaveBeenCalled();
    });
  });

  describe('reverseOrderShopCoupons', () => {
    it('reverses only shop-coupon usages, idempotently', async () => {
      usageRepo.findAppliedByOrderIdWithCoupon.mockResolvedValue([
        { id: 1, coupon_id: 5, coupon: { shop_id: 7 } },
        { id: 2, coupon_id: 6, coupon: { shop_id: null } }, // platform — skipped
      ]);
      usageRepo.reverseIfApplied.mockResolvedValue(true);

      await service.reverseOrderShopCoupons(42);

      expect(usageRepo.reverseIfApplied).toHaveBeenCalledTimes(1);
      expect(usageRepo.reverseIfApplied).toHaveBeenCalledWith(1);
      expect(couponRepo.decrementUsage).toHaveBeenCalledWith(5);
      expect(couponRepo.decrementUsage).not.toHaveBeenCalledWith(6);
    });

    it('does not decrement when the row was already reversed', async () => {
      usageRepo.findAppliedByOrderIdWithCoupon.mockResolvedValue([
        { id: 1, coupon_id: 5, coupon: { shop_id: 7 } },
      ]);
      usageRepo.reverseIfApplied.mockResolvedValue(false);

      await service.reverseOrderShopCoupons(42);

      expect(couponRepo.decrementUsage).not.toHaveBeenCalled();
    });
  });

  describe('reverseGroupPlatformCoupon', () => {
    it('reverses only platform usages and decrements once per coupon', async () => {
      usageRepo.findActiveByGroupIdWithCoupon.mockResolvedValue([
        { id: 1, coupon_id: 6, coupon: { shop_id: null } },
        { id: 2, coupon_id: 6, coupon: { shop_id: null } },
        { id: 3, coupon_id: 5, coupon: { shop_id: 7 } }, // shop — skipped
      ]);
      usageRepo.reverseIfApplied.mockResolvedValue(true);

      await service.reverseGroupPlatformCoupon('group-x');

      expect(usageRepo.reverseIfApplied).toHaveBeenCalledTimes(2);
      expect(couponRepo.decrementUsage).toHaveBeenCalledTimes(1);
      expect(couponRepo.decrementUsage).toHaveBeenCalledWith(6);
    });

    it('is a no-op when there are no platform usages', async () => {
      usageRepo.findActiveByGroupIdWithCoupon.mockResolvedValue([
        { id: 3, coupon_id: 5, coupon: { shop_id: 7 } },
      ]);
      await service.reverseGroupPlatformCoupon('group-x');
      expect(usageRepo.reverseIfApplied).not.toHaveBeenCalled();
      expect(couponRepo.decrementUsage).not.toHaveBeenCalled();
    });
  });

  describe('getUsagesForOrder', () => {
    it('maps applied usages to code + discount', async () => {
      usageRepo.findAppliedByOrderIdWithCoupon.mockResolvedValue([
        { discount_amount: 10000, coupon: { code: 'PLAT' } },
        { discount_amount: 5000, coupon: { code: 'MY-SHOP-SALE' } },
      ]);
      const res = await service.getUsagesForOrder(42);
      expect(res).toEqual([
        { code: 'PLAT', discount_amount: 10000 },
        { code: 'MY-SHOP-SALE', discount_amount: 5000 },
      ]);
    });
  });

  // ─── getAvailableCouponsForCart (Phase 4 voucher picker) ───

  describe('getAvailableCouponsForCart', () => {
    // Cart item that also carries the eager-loaded shop name (as the real cart
    // relation does), so we can assert shop_name mapping.
    function namedCartItem(
      shopId: number,
      shopName: string,
      price: number,
      quantity = 1,
      opts: { productId?: number } = {},
    ): any {
      const item = cartItem(shopId, price, quantity, opts);
      item.product_variant.product.shop = { id: shopId, name: shopName };
      return item;
    }

    it('returns empty groups when the cart is empty (CartEmptyException, no 400)', async () => {
      cartService.getCartWithItems.mockRejectedValue(new CartEmptyException());
      const res = await service.getAvailableCouponsForCart(1);
      expect(res).toEqual({ platform: [], shops: [] });
      expect(couponRepo.findAvailableForCart).not.toHaveBeenCalled();
    });

    it('queries the repo with only the cart shop ids and groups platform + shops', async () => {
      cartService.getCartWithItems.mockResolvedValue({
        items: [
          namedCartItem(1, 'Shop One', 100_000, 1, { productId: 11 }),
          namedCartItem(2, 'Shop Two', 200_000, 1, { productId: 22 }),
        ],
      });
      couponRepo.findAvailableForCart.mockResolvedValue([
        buildCoupon({ id: 100, code: 'PLAT10', shop_id: null }),
        buildCoupon({ id: 200, code: 'S1-SALE', shop_id: 1 }),
      ]);

      const res = await service.getAvailableCouponsForCart(1);

      expect(couponRepo.findAvailableForCart).toHaveBeenCalledWith(
        [1, 2],
        expect.any(Date),
      );
      expect(res.platform.map((c) => c.code)).toEqual(['PLAT10']);
      expect(res.shops).toHaveLength(1);
      expect(res.shops[0]).toMatchObject({
        shop_id: 1,
        shop_name: 'Shop One',
      });
      expect(res.shops[0].coupons.map((c) => c.code)).toEqual(['S1-SALE']);
      // Shop 2 has no coupon → it is not listed at all.
    });

    it('marks eligible when applicable ≥ min and previews the discount', async () => {
      cartService.getCartWithItems.mockResolvedValue({
        items: [namedCartItem(1, 'Shop One', 300_000, 1)],
      });
      couponRepo.findAvailableForCart.mockResolvedValue([
        buildCoupon({
          id: 100,
          code: 'PLAT',
          shop_id: null,
          min_order_amount: 200_000,
          discount_type: DiscountType.Fixed,
          discount_value: 50_000,
        }),
      ]);

      const res = await service.getAvailableCouponsForCart(1);
      const opt = res.platform[0];
      expect(opt.eligible).toBe(true);
      expect(opt.reason).toBeUndefined();
      expect(opt.applicable_total).toBe(300_000);
      expect(opt.discount_preview).toBe(50_000);
    });

    it('marks below_min with short_of_min when applicable < min', async () => {
      cartService.getCartWithItems.mockResolvedValue({
        items: [namedCartItem(1, 'Shop One', 150_000, 1)],
      });
      couponRepo.findAvailableForCart.mockResolvedValue([
        buildCoupon({
          id: 100,
          code: 'PLAT',
          shop_id: null,
          min_order_amount: 200_000,
        }),
      ]);

      const res = await service.getAvailableCouponsForCart(1);
      const opt = res.platform[0];
      expect(opt.eligible).toBe(false);
      expect(opt.reason).toBe('below_min');
      expect(opt.short_of_min).toBe(50_000);
      expect(opt.discount_preview).toBe(0);
    });

    it('marks no_applicable_items when the scope excludes every cart item', async () => {
      cartService.getCartWithItems.mockResolvedValue({
        items: [namedCartItem(1, 'Shop One', 100_000, 1, { productId: 11 })],
      });
      couponRepo.findAvailableForCart.mockResolvedValue([
        buildCoupon({
          id: 200,
          code: 'S1-PROD',
          shop_id: 1,
          scope: CouponScope.Products,
          // targets a product not in the cart
          coupon_products: [{ product_id: 999 }],
        }),
      ]);

      const res = await service.getAvailableCouponsForCart(1);
      const opt = res.shops[0].coupons[0];
      expect(opt.eligible).toBe(false);
      expect(opt.reason).toBe('no_applicable_items');
    });

    it('marks user_limit when the user has already used it max times', async () => {
      cartService.getCartWithItems.mockResolvedValue({
        items: [namedCartItem(1, 'Shop One', 300_000, 1)],
      });
      couponRepo.findAvailableForCart.mockResolvedValue([
        buildCoupon({ id: 100, code: 'PLAT', shop_id: null, max_uses_per_user: 1 }),
      ]);
      usageRepo.countActiveByUserAndCoupon.mockResolvedValue(1);

      const res = await service.getAvailableCouponsForCart(1);
      const opt = res.platform[0];
      expect(opt.eligible).toBe(false);
      expect(opt.reason).toBe('user_limit');
    });
  });
});
