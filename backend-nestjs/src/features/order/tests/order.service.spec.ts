import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DataSource } from 'typeorm';
import { NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { OrderService } from '../order.service';
import { OrderRepository } from '../repositories/order.repository';
import { OrderItemRepository } from '../repositories/order-item.repository';
import { CartService } from '../../cart/cart.service';
import { ProductService } from '../../product/product.service';
import { UserProfileService } from '../../user-profile/user-profile.service';
import { PaymentMethod, OrderStatus } from '../../../common/constants';

const mockQueryRunner = {
  connect: jest.fn(),
  startTransaction: jest.fn(),
  commitTransaction: jest.fn(),
  rollbackTransaction: jest.fn(),
  release: jest.fn(),
  manager: {
    create: jest.fn((entity, data) => data),
    save: jest.fn((data) => Promise.resolve(Array.isArray(data) ? data : { id: 42, ...data })),
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

  describe('checkout', () => {
    const userId = 1;
    const dto = { payment_method: PaymentMethod.Cod, address_id: 5 };

    it('should create order within a transaction and emit event after commit', async () => {
      // Arrange
      const mockCart = {
        id: 1,
        items: [
          {
            id: 1,
            product_variant_id: 10,
            quantity: 2,
            product_variant: {
              id: 10,
              sku: 'ATN-BLK-L',
              price: 250000,
              sale_price: null,
              stock_quantity: 5,
              product: { name: 'Áo thun nam', thumbnail_url: 'http://img.jpg' },
            },
          },
        ],
      };
      const mockAddress = {
        id: 5,
        full_name: 'Nguyen Van A',
        phone: '0901234567',
        address_line: '123 Le Loi',
        city: 'Ho Chi Minh',
      };

      cartService.getCartWithItems.mockResolvedValue(mockCart as any);
      productService.findVariantById.mockResolvedValue(mockCart.items[0].product_variant as any);
      userProfileService.findAddressById.mockResolvedValue(mockAddress as any);

      // Act
      const result = await service.checkout(userId, dto as any);

      // Assert — transaction lifecycle
      expect(mockQueryRunner.connect).toHaveBeenCalled();
      expect(mockQueryRunner.startTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
      expect(mockQueryRunner.rollbackTransaction).not.toHaveBeenCalled();

      // Assert — cart cleared within transaction (receives manager)
      expect(cartService.clearCart).toHaveBeenCalledWith(userId, mockQueryRunner.manager);

      // Assert — event emitted after commit
      expect(eventEmitter.emit).toHaveBeenCalledWith('order.created', {
        orderId: 42,
        items: [{ productVariantId: 10, quantity: 2 }],
      });

      expect(result.id).toBe(42);
      expect(result.status).toBe('pending');
    });

    it('should rollback transaction on failure', async () => {
      const mockCart = {
        id: 1,
        items: [
          {
            id: 1,
            product_variant_id: 10,
            quantity: 2,
            product_variant: {
              id: 10,
              sku: 'ATN-BLK-L',
              price: 250000,
              sale_price: null,
              stock_quantity: 5,
              product: { name: 'Test', thumbnail_url: null },
            },
          },
        ],
      };

      cartService.getCartWithItems.mockResolvedValue(mockCart as any);
      productService.findVariantById.mockResolvedValue(mockCart.items[0].product_variant as any);
      userProfileService.findAddressById.mockResolvedValue({ id: 5, full_name: 'A', phone: '0', address_line: 'B', city: 'C' } as any);
      mockQueryRunner.manager.save.mockRejectedValueOnce(new Error('DB error'));

      await expect(service.checkout(userId, dto as any)).rejects.toThrow('DB error');

      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
      expect(eventEmitter.emit).not.toHaveBeenCalled();
    });

    it('should throw InsufficientStockException when stock is not enough', async () => {
      const mockCart = {
        items: [
          {
            product_variant_id: 10,
            quantity: 10,
            product_variant: {
              id: 10,
              sku: 'ATN-BLK-L',
              price: 250000,
              stock_quantity: 5,
            },
          },
        ],
      };
      cartService.getCartWithItems.mockResolvedValue(mockCart as any);
      productService.findVariantById.mockResolvedValue({
        id: 10,
        sku: 'ATN-BLK-L',
        stock_quantity: 5,
      } as any);

      await expect(service.checkout(userId, dto as any)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('cancelOrder', () => {
    it('should cancel a pending order and emit order.cancelled', async () => {
      // Arrange
      const order = {
        id: 1,
        user_id: 1,
        status: OrderStatus.Pending,
        payment_method: 'cod',
        payment_status: 'unpaid',
        shipping_fee: 30000,
        total_amount: 500000,
        shipping_address: '{}',
        created_at: new Date(),
        order_items: [
          { id: 1, product_variant_id: 10, quantity: 2, product_name: 'Test', sku: 'T-1', price: 235000, thumbnail_url: null },
        ],
      };
      orderRepository.findByIdWithItems.mockResolvedValue(order as any);

      // Act
      const result = await service.cancelOrder(1, 1);

      // Assert
      expect(result.status).toBe('cancelled');
      expect(orderRepository.updateStatus).toHaveBeenCalledWith(1, OrderStatus.Cancelled);
      expect(eventEmitter.emit).toHaveBeenCalledWith('order.cancelled', expect.any(Object));
    });

    it('should throw ForbiddenException when order belongs to another user', async () => {
      orderRepository.findByIdWithItems.mockResolvedValue({
        id: 1,
        user_id: 999,
        status: OrderStatus.Pending,
      } as any);

      await expect(service.cancelOrder(1, 1)).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException when order is not pending', async () => {
      orderRepository.findByIdWithItems.mockResolvedValue({
        id: 1,
        user_id: 1,
        status: OrderStatus.Delivered,
      } as any);

      await expect(service.cancelOrder(1, 1)).rejects.toThrow(BadRequestException);
    });
  });

  describe('updateOrderStatus', () => {
    it('should reject invalid status transitions', async () => {
      orderRepository.findByIdWithItemsAndUser.mockResolvedValue({
        id: 1,
        status: OrderStatus.Delivered,
        order_items: [],
      } as any);

      await expect(
        service.updateOrderStatus(1, { status: OrderStatus.Pending }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should allow valid status transitions', async () => {
      const order = {
        id: 1,
        user_id: 1,
        status: OrderStatus.Pending,
        payment_method: 'cod',
        payment_status: 'unpaid',
        shipping_fee: 0,
        total_amount: 100000,
        shipping_address: '{}',
        created_at: new Date(),
        order_items: [],
      };
      orderRepository.findByIdWithItemsAndUser.mockResolvedValue(order as any);

      const result = await service.updateOrderStatus(1, { status: OrderStatus.Confirmed });

      expect(orderRepository.updateStatus).toHaveBeenCalledWith(1, OrderStatus.Confirmed);
      expect(result.status).toBe(OrderStatus.Confirmed);
    });
  });
});
