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
            findByUserIdPaginated: jest.fn(),
            findAllPaginated: jest.fn(),
            create: jest.fn(),
            updateStatus: jest.fn(),
            updatePaymentStatus: jest.fn(),
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
            validateAndCalculateDiscount: jest.fn(),
            recordUsage: jest.fn(),
            reverseCouponUsage: jest.fn(),
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

    it('should throw NotFoundException when order does not exist', async () => {
      // Arrange
      orderRepository.findByIdWithItemsAndUser.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findOrderById(999)).rejects.toThrow(
        NotFoundException,
      );
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
