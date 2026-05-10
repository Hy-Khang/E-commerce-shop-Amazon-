import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { OrderService } from '../order.service';
import { OrderRepository } from '../repositories/order.repository';
import { OrderItemRepository } from '../repositories/order-item.repository';
import { CartService } from '../../cart/cart.service';
import { ProductService } from '../../product/product.service';
import { UserProfileService } from '../../user-profile/user-profile.service';
import { PaymentMethod, OrderStatus } from '../../../common/constants';

describe('OrderService', () => {
  let service: OrderService;
  let orderRepository: jest.Mocked<OrderRepository>;
  let orderItemRepository: jest.Mocked<OrderItemRepository>;
  let cartService: jest.Mocked<CartService>;
  let productService: jest.Mocked<ProductService>;
  let userProfileService: jest.Mocked<UserProfileService>;
  let eventEmitter: jest.Mocked<EventEmitter2>;

  beforeEach(async () => {
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

    it('should create order with snapshot data from cart items', async () => {
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
      const mockOrder = {
        id: 42,
        user_id: userId,
        status: 'pending',
        payment_method: 'cod',
        payment_status: 'unpaid',
        shipping_fee: 30000,
        total_amount: 530000,
        shipping_address: JSON.stringify(mockAddress),
        created_at: new Date(),
        order_items: [],
      };

      cartService.getCartWithItems.mockResolvedValue(mockCart as any);
      productService.findVariantById.mockResolvedValue(mockCart.items[0].product_variant as any);
      userProfileService.findAddressById.mockResolvedValue(mockAddress as any);
      orderRepository.create.mockResolvedValue(mockOrder as any);
      orderItemRepository.createMany.mockResolvedValue([
        {
          id: 1,
          order_id: 42,
          product_variant_id: 10,
          product_name: 'Áo thun nam',
          sku: 'ATN-BLK-L',
          price: 250000,
          quantity: 2,
          thumbnail_url: 'http://img.jpg',
        },
      ] as any);

      // Act
      const result = await service.checkout(userId, dto as any);

      // Assert
      expect(result.id).toBe(42);
      expect(result.status).toBe('pending');
      expect(cartService.clearCart).toHaveBeenCalledWith(userId);
      expect(eventEmitter.emit).toHaveBeenCalledWith('order.created', {
        orderId: 42,
        items: [{ productVariantId: 10, quantity: 2 }],
      });
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
