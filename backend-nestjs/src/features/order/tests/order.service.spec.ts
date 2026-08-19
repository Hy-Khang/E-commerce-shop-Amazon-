import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DataSource } from 'typeorm';
import {
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { OrderService } from '../order.service';
import { OrderRepository } from '../repositories/order.repository';
import { OrderItemRepository } from '../repositories/order-item.repository';
import { OrderStatusHistoryRepository } from '../repositories/order-status-history.repository';
import { OrderTrackingLocationRepository } from '../repositories/order-tracking-location.repository';
import { CartService } from '../../cart/cart.service';
import { ProductService } from '../../product/product.service';
import { UserProfileService } from '../../user-profile/user-profile.service';
import { CouponService } from '../../coupon/coupon.service';
import { ShopService } from '../../shop/shop.service';
import { PaymentMethod, OrderStatus, PaymentStatus } from '../../../common/constants';
import { InsufficientStockException } from '../../../common/exceptions/insufficient-stock.exception';
import {
  mockOrder,
  mockOrderWithUser,
  mockCartForCheckout,
  mockAddress,
  mockPaginatedOrders,
} from './mocks/order.mock';
import {
  mockProduct,
  mockProductVariant,
} from '../../product/tests/mocks/product.mock';

const mockQueryRunner = {
  connect: jest.fn(),
  startTransaction: jest.fn(),
  commitTransaction: jest.fn(),
  rollbackTransaction: jest.fn(),
  release: jest.fn(),
  manager: {
    create: jest.fn((_entity, data) => data),
    save: jest.fn((data) =>
      Promise.resolve(Array.isArray(data) ? data : { id: 42, ...data }),
    ),
  },
};

describe('OrderService', () => {
  let service: OrderService;
  let orderRepository: jest.Mocked<OrderRepository>;
  let orderItemRepository: jest.Mocked<OrderItemRepository>;
  let cartService: jest.Mocked<CartService>;
  let productService: jest.Mocked<ProductService>;
  let userProfileService: jest.Mocked<UserProfileService>;
  let eventEmitter: jest.Mocked<EventEmitter2>;
  let couponService: jest.Mocked<CouponService>;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderService,
        {
          provide: OrderRepository,
          useValue: {
            findByIdWithItems: jest.fn(),
            findByIdWithItemsAndUser: jest.fn(),
            findByIdWithItemsForShop: jest.fn(),
            findByUserIdPaginated: jest.fn(),
            findAllPaginated: jest.fn(),
            create: jest.fn(),
            updateStatus: jest.fn(),
            updateStatusWithDeliveredAt: jest.fn(),
            updatePaymentStatus: jest.fn(),
            areAllGroupOrdersCancelled: jest.fn().mockResolvedValue(false),
          },
        },
        {
          provide: OrderItemRepository,
          useValue: { createMany: jest.fn() },
        },
        {
          provide: OrderStatusHistoryRepository,
          useValue: { createEntry: jest.fn(), findByOrderId: jest.fn() },
        },
        {
          provide: OrderTrackingLocationRepository,
          useValue: { insertLocation: jest.fn(), findLatestByOrderId: jest.fn(), findAllByOrderId: jest.fn() },
        },
        {
          provide: CartService,
          useValue: { getCartWithItems: jest.fn(), clearCart: jest.fn() },
        },
        {
          provide: ProductService,
          useValue: { findVariantById: jest.fn() },
        },
        {
          provide: UserProfileService,
          useValue: { findAddressById: jest.fn() },
        },
        {
          provide: EventEmitter2,
          useValue: { emit: jest.fn() },
        },
        {
          provide: CouponService,
          useValue: {
            validateAndCalculateDiscounts: jest.fn().mockResolvedValue([]),
            getUsagesForOrder: jest.fn().mockResolvedValue([]),
            recordUsage: jest.fn(),
            reverseOrderShopCoupons: jest.fn(),
            reverseGroupPlatformCoupon: jest.fn(),
          },
        },
        {
          provide: ShopService,
          useValue: {
            resolveShopByUserId: jest.fn(),
            findShopById: jest.fn(),
          },
        },
        {
          provide: DataSource,
          useValue: { createQueryRunner: jest.fn(() => mockQueryRunner) },
        },
      ],
    }).compile();

    service = module.get(OrderService);
    orderRepository = module.get(OrderRepository);
    orderItemRepository = module.get(OrderItemRepository);
    cartService = module.get(CartService);
    productService = module.get(ProductService);
    userProfileService = module.get(UserProfileService);
    eventEmitter = module.get(EventEmitter2);
    couponService = module.get(CouponService);
  });

  // ─── checkout ───

  describe('checkout', () => {
    const userId = 1;
    const dto = { payment_method: PaymentMethod.Cod, address_id: 5 };

    it('should create order within a transaction and emit event after commit', async () => {
      // Arrange
      const cart = mockCartForCheckout(1);
      const address = mockAddress();

      cartService.getCartWithItems.mockResolvedValue(cart as any);
      productService.findVariantById.mockResolvedValue(
        cart.items[0].product_variant as any,
      );
      userProfileService.findAddressById.mockResolvedValue(address as any);

      // Act
      const result = await service.checkout(userId, dto as any);

      // Assert — transaction lifecycle
      expect(mockQueryRunner.connect).toHaveBeenCalled();
      expect(mockQueryRunner.startTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
      expect(mockQueryRunner.rollbackTransaction).not.toHaveBeenCalled();

      // Assert — cart cleared within transaction
      expect(cartService.clearCart).toHaveBeenCalledWith(
        userId,
        mockQueryRunner.manager,
      );

      // Assert — event emitted after commit
      expect(eventEmitter.emit).toHaveBeenCalledWith('order.created', {
        orderId: 42,
        items: [{ productVariantId: cart.items[0].product_variant_id, quantity: 1 }],
      });

      expect(result.order_group_id).toBeDefined();
      expect(result.orders).toHaveLength(1);
      expect(result.orders[0].id).toBe(42);
      expect(result.orders[0].status).toBe('pending');
    });

    it('should calculate total correctly with multiple cart items', async () => {
      // Arrange
      const cart = mockCartForCheckout(3);
      const address = mockAddress();

      cartService.getCartWithItems.mockResolvedValue(cart as any);
      for (const item of cart.items) {
        productService.findVariantById.mockResolvedValueOnce(
          item.product_variant as any,
        );
      }
      userProfileService.findAddressById.mockResolvedValue(address as any);

      // Act
      const result = await service.checkout(userId, dto as any);

      // Assert — 3 items: price=250000 * qty(1) + price*qty(2) + price*qty(3) + shipping(30000)
      const expectedItemsTotal = 250000 * 1 + 250000 * 2 + 250000 * 3;
      expect(result.total_amount).toBe(expectedItemsTotal + 30000);
    });

    it('should use sale_price when available', async () => {
      // Arrange
      const cart = mockCartForCheckout(1);
      cart.items[0].product_variant.sale_price = 200000 as any;
      cart.items[0].quantity = 1;
      const address = mockAddress();

      cartService.getCartWithItems.mockResolvedValue(cart as any);
      productService.findVariantById.mockResolvedValue(
        cart.items[0].product_variant as any,
      );
      userProfileService.findAddressById.mockResolvedValue(address as any);

      // Act
      const result = await service.checkout(userId, dto as any);

      // Assert — total = sale_price (200000) * 1 + shipping (30000) = 230000
      expect(result.total_amount).toBe(230000);
    });

    it('should rollback transaction on failure', async () => {
      // Arrange
      const cart = mockCartForCheckout(1);
      const address = mockAddress();

      cartService.getCartWithItems.mockResolvedValue(cart as any);
      productService.findVariantById.mockResolvedValue(
        cart.items[0].product_variant as any,
      );
      userProfileService.findAddressById.mockResolvedValue(address as any);
      mockQueryRunner.manager.save.mockRejectedValueOnce(new Error('DB error'));

      // Act & Assert
      await expect(service.checkout(userId, dto as any)).rejects.toThrow(
        'DB error',
      );
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
      expect(eventEmitter.emit).not.toHaveBeenCalled();
    });

    it('should throw InsufficientStockException when stock is insufficient', async () => {
      // Arrange
      const cart = mockCartForCheckout(1);
      cart.items[0].quantity = 999;
      cartService.getCartWithItems.mockResolvedValue(cart as any);
      productService.findVariantById.mockResolvedValue({
        ...cart.items[0].product_variant,
        stock_quantity: 5,
      } as any);

      // Act & Assert
      await expect(service.checkout(userId, dto as any)).rejects.toThrow(
        InsufficientStockException,
      );
    });

    it('should throw InsufficientStockException when variant is not found', async () => {
      // Arrange
      const cart = mockCartForCheckout(1);
      cartService.getCartWithItems.mockResolvedValue(cart as any);
      productService.findVariantById.mockResolvedValue(null);

      // Act & Assert
      await expect(service.checkout(userId, dto as any)).rejects.toThrow(
        InsufficientStockException,
      );
    });

    it('should throw NotFoundException when address is not found', async () => {
      // Arrange
      const cart = mockCartForCheckout(1);
      cartService.getCartWithItems.mockResolvedValue(cart as any);
      productService.findVariantById.mockResolvedValue(
        cart.items[0].product_variant as any,
      );
      userProfileService.findAddressById.mockResolvedValue(null);

      // Act & Assert
      await expect(service.checkout(userId, dto as any)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ─── checkout: multi-coupon distribution (Phase 2) ───

  describe('checkout — multi-coupon distribution', () => {
    const userId = 1;

    // Cart with two shops: shop 1 = 100k, shop 2 = 300k.
    function twoShopCart() {
      const p1 = mockProduct({
        id: 1,
        shop_id: 1,
        shop: { id: 1, name: 'Shop One', slug: 'shop-one' } as any,
      });
      const v1 = mockProductVariant({
        id: 10,
        sku: 'S1',
        price: 100000,
        sale_price: null as any,
        stock_quantity: 100,
        product: p1,
        product_id: 1,
      });
      const p2 = mockProduct({
        id: 2,
        shop_id: 2,
        shop: { id: 2, name: 'Shop Two', slug: 'shop-two' } as any,
      });
      const v2 = mockProductVariant({
        id: 20,
        sku: 'S2',
        price: 300000,
        sale_price: null as any,
        stock_quantity: 100,
        product: p2,
        product_id: 2,
      });
      return {
        id: 1,
        items: [
          { id: 1, product_variant_id: 10, quantity: 1, product_variant: v1 },
          { id: 2, product_variant_id: 20, quantity: 1, product_variant: v2 },
        ],
      };
    }

    function arrangeCart(cart: ReturnType<typeof twoShopCart>) {
      cartService.getCartWithItems.mockResolvedValue(cart as any);
      productService.findVariantById.mockImplementation((id: number) =>
        Promise.resolve(
          cart.items.find((i) => i.product_variant_id === id)!
            .product_variant as any,
        ),
      );
      userProfileService.findAddressById.mockResolvedValue(mockAddress() as any);
    }

    function orderFor(result: any, shopId: number) {
      return result.orders.find((o: any) => o.shop_id === shopId);
    }

    it('routes a shop coupon entirely onto its own sub-order', async () => {
      arrangeCart(twoShopCart());
      couponService.validateAndCalculateDiscounts.mockResolvedValue([
        {
          coupon_id: 5,
          coupon_code: 'SHOP1',
          coupon_shop_id: 1,
          discount_amount: 20000,
          applicable_by_shop: { 1: 100000 },
        },
      ] as any);

      const result = await service.checkout(userId, {
        payment_method: PaymentMethod.Cod,
        address_id: 5,
        coupon_codes: ['SHOP1'],
      } as any);

      expect(orderFor(result, 1).discount_amount).toBe(20000);
      expect(orderFor(result, 1).coupon_code).toBe('SHOP1');
      expect(orderFor(result, 2).discount_amount).toBe(0);
      expect(orderFor(result, 2).coupon_code).toBeNull();
    });

    it('splits a platform coupon across shops by applicable subtotal (sums exactly)', async () => {
      arrangeCart(twoShopCart());
      couponService.validateAndCalculateDiscounts.mockResolvedValue([
        {
          coupon_id: 6,
          coupon_code: 'PLAT',
          coupon_shop_id: null,
          discount_amount: 40000,
          applicable_by_shop: { 1: 100000, 2: 300000 },
        },
      ] as any);

      const result = await service.checkout(userId, {
        payment_method: PaymentMethod.Cod,
        address_id: 5,
        coupon_codes: ['PLAT'],
      } as any);

      // 40000 split 100k:300k → 10000 / 30000
      expect(orderFor(result, 1).discount_amount).toBe(10000);
      expect(orderFor(result, 2).discount_amount).toBe(30000);
      const sum =
        orderFor(result, 1).discount_amount + orderFor(result, 2).discount_amount;
      expect(sum).toBe(40000);
    });

    it('applies a shop coupon first, then fills headroom with the platform share', async () => {
      arrangeCart(twoShopCart());
      couponService.validateAndCalculateDiscounts.mockResolvedValue([
        {
          coupon_id: 6,
          coupon_code: 'PLAT',
          coupon_shop_id: null,
          discount_amount: 40000,
          applicable_by_shop: { 1: 100000, 2: 300000 },
        },
        {
          coupon_id: 5,
          coupon_code: 'SHOP1',
          coupon_shop_id: 1,
          discount_amount: 90000,
          applicable_by_shop: { 1: 100000 },
        },
      ] as any);

      const result = await service.checkout(userId, {
        payment_method: PaymentMethod.Cod,
        address_id: 5,
        coupon_codes: ['PLAT', 'SHOP1'],
      } as any);

      // shop1: 90000 shop coupon + min(platformShare 10000, headroom 10000) = 100000 (capped at items total)
      expect(orderFor(result, 1).discount_amount).toBe(100000);
      // shop2: platform share only = 30000
      expect(orderFor(result, 2).discount_amount).toBe(30000);

      // both coupons recorded as usages
      const recordedCoupons = couponService.recordUsage.mock.calls.map((c) => c[0]);
      expect(recordedCoupons).toContain(5);
      expect(recordedCoupons).toContain(6);
    });

    it('waterfalls a capped shop’s platform share to another shop (no discount lost)', async () => {
      arrangeCart(twoShopCart());
      couponService.validateAndCalculateDiscounts.mockResolvedValue([
        {
          coupon_id: 6,
          coupon_code: 'PLAT',
          coupon_shop_id: null,
          discount_amount: 60000,
          applicable_by_shop: { 1: 100000, 2: 300000 },
        },
        {
          coupon_id: 5,
          coupon_code: 'SHOP1',
          coupon_shop_id: 1,
          discount_amount: 98000, // leaves only 2k headroom on shop 1
          applicable_by_shop: { 1: 100000 },
        },
      ] as any);

      const result = await service.checkout(userId, {
        payment_method: PaymentMethod.Cod,
        address_id: 5,
        coupon_codes: ['PLAT', 'SHOP1'],
      } as any);

      // shop1 fully discounted (98k shop + 2k platform); shop2 absorbs the
      // 13k leftover the naive clamp would have lost (45k + 13k = 58k).
      expect(orderFor(result, 1).discount_amount).toBe(100000);
      expect(orderFor(result, 2).discount_amount).toBe(58000);
      // platform total preserved: 2k + 58k = 60k
      expect(
        orderFor(result, 1).discount_amount +
          orderFor(result, 2).discount_amount,
      ).toBe(158000); // 98k shop + 60k platform
    });

    it('rolls back checkout when a coupon runs out mid-transaction (COUPON_003)', async () => {
      arrangeCart(twoShopCart());
      couponService.validateAndCalculateDiscounts.mockResolvedValue([
        {
          coupon_id: 5,
          coupon_code: 'SHOP1',
          coupon_shop_id: 1,
          discount_amount: 20000,
          applicable_by_shop: { 1: 100000 },
        },
      ] as any);
      couponService.recordUsage.mockRejectedValueOnce(
        new BadRequestException({
          code: 'COUPON_003',
          message: 'Coupon usage limit has been exceeded',
        }),
      );

      await expect(
        service.checkout(userId, {
          payment_method: PaymentMethod.Cod,
          address_id: 5,
          coupon_codes: ['SHOP1'],
        } as any),
      ).rejects.toMatchObject({ response: { code: 'COUPON_003' } });

      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.commitTransaction).not.toHaveBeenCalled();
    });
  });

  // ─── previewCheckout ───

  describe('previewCheckout', () => {
    const userId = 1;

    function twoShopCart() {
      const p1 = mockProduct({
        id: 1,
        shop_id: 1,
        shop: { id: 1, name: 'Shop One', slug: 'shop-one' } as any,
      });
      const v1 = mockProductVariant({
        id: 10,
        sku: 'S1',
        price: 100000,
        sale_price: null as any,
        stock_quantity: 100,
        product: p1,
        product_id: 1,
      });
      const p2 = mockProduct({
        id: 2,
        shop_id: 2,
        shop: { id: 2, name: 'Shop Two', slug: 'shop-two' } as any,
      });
      const v2 = mockProductVariant({
        id: 20,
        sku: 'S2',
        price: 300000,
        sale_price: null as any,
        stock_quantity: 100,
        product: p2,
        product_id: 2,
      });
      return {
        id: 1,
        items: [
          { id: 1, product_variant_id: 10, quantity: 1, product_variant: v1 },
          { id: 2, product_variant_id: 20, quantity: 1, product_variant: v2 },
        ],
      };
    }

    it('returns zeros for an empty cart and never records usage', async () => {
      cartService.getCartWithItems.mockResolvedValue({ id: 1, items: [] } as any);

      const result = await service.previewCheckout(userId, {});

      expect(result.subtotal).toBe(0);
      expect(result.grand_total).toBe(0);
      expect(result.shops).toHaveLength(0);
      expect(couponService.recordUsage).not.toHaveBeenCalled();
    });

    it('builds an exact per-shop breakdown without writing anything', async () => {
      cartService.getCartWithItems.mockResolvedValue(twoShopCart() as any);
      couponService.validateAndCalculateDiscounts.mockResolvedValue([
        {
          coupon_id: 6,
          coupon_code: 'PLAT',
          coupon_shop_id: null,
          discount_amount: 40000,
          applicable_by_shop: { 1: 100000, 2: 300000 },
        },
      ] as any);

      const result = await service.previewCheckout(userId, {
        coupon_codes: ['PLAT'],
      });

      expect(result.subtotal).toBe(400000);
      expect(result.discount_total).toBe(40000);
      const shop1 = result.shops.find((s) => s.shop_id === 1)!;
      const shop2 = result.shops.find((s) => s.shop_id === 2)!;
      expect(shop1.discount_amount).toBe(10000);
      expect(shop2.discount_amount).toBe(30000);
      expect(result.applied_coupons).toEqual([
        { code: 'PLAT', discount_amount: 40000 },
      ]);
      // read-only: no usage recorded
      expect(couponService.recordUsage).not.toHaveBeenCalled();
      expect(mockQueryRunner.startTransaction).not.toHaveBeenCalled();
    });

    it('skips coupon calc when no codes are supplied', async () => {
      cartService.getCartWithItems.mockResolvedValue(twoShopCart() as any);

      const result = await service.previewCheckout(userId, {});

      expect(couponService.validateAndCalculateDiscounts).not.toHaveBeenCalled();
      expect(result.discount_total).toBe(0);
      expect(result.subtotal).toBe(400000);
    });
  });

  // ─── findMyOrders ───

  describe('findMyOrders', () => {
    it('should return paginated orders for user', async () => {
      // Arrange
      const orders = mockPaginatedOrders();
      orderRepository.findByUserIdPaginated.mockResolvedValue(orders as any);

      // Act
      const result = await service.findMyOrders(1, { page: 1, limit: 20 } as any);

      // Assert
      expect(orderRepository.findByUserIdPaginated).toHaveBeenCalledWith(
        1, 1, 20, undefined, undefined,
      );
      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });

    it('should use default page and limit when not provided', async () => {
      // Arrange
      orderRepository.findByUserIdPaginated.mockResolvedValue(
        mockPaginatedOrders() as any,
      );

      // Act
      await service.findMyOrders(1, {} as any);

      // Assert
      expect(orderRepository.findByUserIdPaginated).toHaveBeenCalledWith(
        1, 1, 20, undefined, undefined,
      );
    });

    it('should pass sort and order params to repository', async () => {
      // Arrange
      orderRepository.findByUserIdPaginated.mockResolvedValue(
        mockPaginatedOrders() as any,
      );
      const query = { page: 2, limit: 10, sort: 'created_at', order: 'desc' as const };

      // Act
      await service.findMyOrders(1, query as any);

      // Assert
      expect(orderRepository.findByUserIdPaginated).toHaveBeenCalledWith(
        1, 2, 10, 'created_at', 'desc',
      );
    });
  });

  // ─── findMyOrderById ───

  describe('findMyOrderById', () => {
    it('should return order when it belongs to user', async () => {
      // Arrange
      const order = mockOrder({ user_id: 1 });
      orderRepository.findByIdWithItems.mockResolvedValue(order as any);

      // Act
      const result = await service.findMyOrderById(1, 1);

      // Assert
      expect(result.id).toBe(order.id);
      expect(result.status).toBe(order.status);
    });

    it('should throw NotFoundException when order does not exist', async () => {
      // Arrange
      orderRepository.findByIdWithItems.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findMyOrderById(1, 999)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException when order belongs to another user', async () => {
      // Arrange
      const order = mockOrder({ user_id: 999 });
      orderRepository.findByIdWithItems.mockResolvedValue(order as any);

      // Act & Assert
      await expect(service.findMyOrderById(1, 1)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  // ─── cancelOrder ───

  describe('cancelOrder', () => {
    it('should cancel a pending order and emit order.cancelled', async () => {
      // Arrange
      const order = mockOrder({ user_id: 1, status: OrderStatus.Pending });
      orderRepository.findByIdWithItems.mockResolvedValue(order as any);

      // Act
      const result = await service.cancelOrder(1, 1);

      // Assert
      expect(result.status).toBe('cancelled');
      expect(orderRepository.updateStatus).toHaveBeenCalledWith(
        1,
        OrderStatus.Cancelled,
      );
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'order.cancelled',
        expect.objectContaining({ orderId: 1 }),
      );
    });

    it('reverses both shop and platform coupons for a single-order group', async () => {
      // A 1-shop checkout still has an order_group_id, and its lone order is the
      // whole group — cancelling it must reverse the platform coupon too.
      const order = mockOrder({ user_id: 1, status: OrderStatus.Pending });
      orderRepository.findByIdWithItems.mockResolvedValue(order as any);
      orderRepository.areAllGroupOrdersCancelled.mockResolvedValue(true);

      await service.cancelOrder(1, 1);

      expect(couponService.reverseOrderShopCoupons).toHaveBeenCalledWith(order.id);
      expect(couponService.reverseGroupPlatformCoupon).toHaveBeenCalledWith(
        order.order_group_id,
      );
    });

    it('does not reverse the platform coupon while other group orders remain', async () => {
      const order = mockOrder({ user_id: 1, status: OrderStatus.Pending });
      orderRepository.findByIdWithItems.mockResolvedValue(order as any);
      orderRepository.areAllGroupOrdersCancelled.mockResolvedValue(false);

      await service.cancelOrder(1, 1);

      expect(couponService.reverseOrderShopCoupons).toHaveBeenCalledWith(order.id);
      expect(couponService.reverseGroupPlatformCoupon).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when order does not exist', async () => {
      // Arrange
      orderRepository.findByIdWithItems.mockResolvedValue(null);

      // Act & Assert
      await expect(service.cancelOrder(1, 999)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException when order belongs to another user', async () => {
      // Arrange
      orderRepository.findByIdWithItems.mockResolvedValue(
        mockOrder({ user_id: 999 }) as any,
      );

      // Act & Assert
      await expect(service.cancelOrder(1, 1)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw BadRequestException when order is not pending', async () => {
      // Arrange
      orderRepository.findByIdWithItems.mockResolvedValue(
        mockOrder({ user_id: 1, status: OrderStatus.Delivered }) as any,
      );

      // Act & Assert
      await expect(service.cancelOrder(1, 1)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  // ─── findAllOrders (admin) ───

  describe('findAllOrders', () => {
    it('should return paginated orders with filters', async () => {
      // Arrange
      const orders = mockPaginatedOrders();
      orderRepository.findAllPaginated.mockResolvedValue(orders as any);
      const query = { page: 1, limit: 20, status: OrderStatus.Pending };

      // Act
      const result = await service.findAllOrders(query as any);

      // Assert
      expect(orderRepository.findAllPaginated).toHaveBeenCalledWith(query);
      expect(result.data).toHaveLength(1);
    });
  });

  // ─── findOrderById (admin) ───

  describe('findOrderById', () => {
    it('should return order with user info', async () => {
      // Arrange
      const order = mockOrderWithUser();
      orderRepository.findByIdWithItemsAndUser.mockResolvedValue(order as any);

      // Act
      const result = await service.findOrderById(1);

      // Assert
      expect(result.id).toBe(order.id);
      expect(result.user_id).toBe(order.user_id);
      expect(result.user_email).toBe('test@test.com');
    });

    it('attaches the applied_coupons breakdown', async () => {
      orderRepository.findByIdWithItemsAndUser.mockResolvedValue(
        mockOrderWithUser() as any,
      );
      couponService.getUsagesForOrder.mockResolvedValue([
        { code: 'PLAT', discount_amount: 10000 },
        { code: 'SHOP1', discount_amount: 5000 },
      ]);

      const result = await service.findOrderById(1);

      expect(couponService.getUsagesForOrder).toHaveBeenCalledWith(
        mockOrderWithUser().id,
      );
      expect(result.applied_coupons).toHaveLength(2);
      expect(result.applied_coupons![0].code).toBe('PLAT');
    });

    it('should throw NotFoundException when order does not exist', async () => {
      // Arrange
      orderRepository.findByIdWithItemsAndUser.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findOrderById(999)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ─── findSellerOrderById ───

  describe('findSellerOrderById', () => {
    it('attaches the applied_coupons breakdown for the seller', async () => {
      (service as any).shopService.resolveShopByUserId.mockResolvedValue({
        id: 7,
      });
      orderRepository.findByIdWithItemsForShop.mockResolvedValue(
        mockOrderWithUser() as any,
      );
      couponService.getUsagesForOrder.mockResolvedValue([
        { code: 'SHOP1', discount_amount: 5000 },
      ]);

      const result = await service.findSellerOrderById(9, 1);

      expect(couponService.getUsagesForOrder).toHaveBeenCalled();
      expect(result.applied_coupons).toEqual([
        { code: 'SHOP1', discount_amount: 5000 },
      ]);
    });
  });

  // ─── updateOrderStatus (admin) ───

  describe('updateOrderStatus', () => {
    it('should allow valid status transition (pending → confirmed)', async () => {
      // Arrange
      const order = mockOrderWithUser({ status: OrderStatus.Pending });
      orderRepository.findByIdWithItemsAndUser.mockResolvedValue(order as any);

      // Act
      const result = await service.updateOrderStatus(1, {
        status: OrderStatus.Confirmed,
      });

      // Assert
      expect(orderRepository.updateStatus).toHaveBeenCalledWith(
        1,
        OrderStatus.Confirmed,
      );
      expect(result.status).toBe(OrderStatus.Confirmed);
    });

    it('should allow valid transition (confirmed → cancelled)', async () => {
      // Arrange
      const order = mockOrderWithUser({ status: OrderStatus.Confirmed });
      orderRepository.findByIdWithItemsAndUser.mockResolvedValue(order as any);

      // Act
      const result = await service.updateOrderStatus(1, {
        status: OrderStatus.Cancelled,
      });

      // Assert
      expect(orderRepository.updateStatus).toHaveBeenCalledWith(
        1,
        OrderStatus.Cancelled,
      );
      expect(result.status).toBe(OrderStatus.Cancelled);
    });

    it('should emit order.cancelled when transitioning to cancelled', async () => {
      // Arrange
      const order = mockOrderWithUser({ status: OrderStatus.Pending });
      orderRepository.findByIdWithItemsAndUser.mockResolvedValue(order as any);

      // Act
      await service.updateOrderStatus(1, { status: OrderStatus.Cancelled });

      // Assert
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'order.cancelled',
        expect.objectContaining({ orderId: 1 }),
      );
    });

    it('should not emit event for non-cancel transitions', async () => {
      // Arrange
      const order = mockOrderWithUser({ status: OrderStatus.Pending });
      orderRepository.findByIdWithItemsAndUser.mockResolvedValue(order as any);

      // Act
      await service.updateOrderStatus(1, { status: OrderStatus.Confirmed });

      // Assert
      expect(eventEmitter.emit).not.toHaveBeenCalled();
    });

    it('should reject invalid status transition (delivered → pending)', async () => {
      // Arrange
      orderRepository.findByIdWithItemsAndUser.mockResolvedValue(
        mockOrderWithUser({ status: OrderStatus.Delivered }) as any,
      );

      // Act & Assert
      await expect(
        service.updateOrderStatus(1, { status: OrderStatus.Pending }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when order does not exist', async () => {
      // Arrange
      orderRepository.findByIdWithItemsAndUser.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.updateOrderStatus(999, { status: OrderStatus.Confirmed }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ─── updatePaymentStatus (admin) ───

  describe('updatePaymentStatus', () => {
    it('should update payment status successfully', async () => {
      // Arrange
      const order = mockOrderWithUser({ payment_status: PaymentStatus.Unpaid });
      orderRepository.findByIdWithItemsAndUser.mockResolvedValue(order as any);

      // Act
      const result = await service.updatePaymentStatus(1, {
        payment_status: PaymentStatus.Paid,
      });

      // Assert
      expect(orderRepository.updatePaymentStatus).toHaveBeenCalledWith(
        1,
        PaymentStatus.Paid,
      );
      expect(result.payment_status).toBe(PaymentStatus.Paid);
    });

    it('should throw NotFoundException when order does not exist', async () => {
      // Arrange
      orderRepository.findByIdWithItemsAndUser.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.updatePaymentStatus(999, {
          payment_status: PaymentStatus.Paid,
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ─── findOrderByIdForReview (cross-feature) ───

  describe('findOrderByIdForReview', () => {
    it('should return order with items', async () => {
      // Arrange
      const order = mockOrder();
      orderRepository.findByIdWithItems.mockResolvedValue(order as any);

      // Act
      const result = await service.findOrderByIdForReview(1);

      // Assert
      expect(result).toEqual(order);
      expect(orderRepository.findByIdWithItems).toHaveBeenCalledWith(1);
    });

    it('should return null when order does not exist', async () => {
      // Arrange
      orderRepository.findByIdWithItems.mockResolvedValue(null);

      // Act
      const result = await service.findOrderByIdForReview(999);

      // Assert
      expect(result).toBeNull();
    });
  });
});
