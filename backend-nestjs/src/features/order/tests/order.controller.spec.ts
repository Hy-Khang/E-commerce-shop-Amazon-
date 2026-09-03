import { Test, TestingModule } from '@nestjs/testing';
import { OrderController } from '../order.controller';
import { OrderService } from '../order.service';
import { CreateOrderDto } from '../dto/create-order.dto';
import { PaymentMethod } from '../../../common/constants';
import type { ICurrentUser } from '../../../common/interfaces/current-user.interface';

describe('OrderController', () => {
  let controller: OrderController;
  let service: jest.Mocked<OrderService>;

  const mockUser: ICurrentUser = {
    id: 1,
    roleId: 1,
  };

  beforeEach(async () => {
    const mockService = {
      checkout: jest.fn(),
      findMyOrders: jest.fn(),
      findMyOrderById: jest.fn(),
      cancelOrder: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrderController],
      providers: [{ provide: OrderService, useValue: mockService }],
    }).compile();

    controller = module.get(OrderController);
    service = module.get(OrderService);
  });

  describe('checkout', () => {
    it('should call orderService.checkout with userId and dto', async () => {
      // Arrange
      const dto: CreateOrderDto = {
        payment_method: PaymentMethod.Cod,
        address_id: 1,
      };
      const mockResponse = { id: 1, status: 'pending' };
      service.checkout.mockResolvedValue(mockResponse as any);

      // Act
      const result = await controller.checkout(mockUser, dto);

      // Assert
      expect(service.checkout).toHaveBeenCalledWith(mockUser.id, dto);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('findMyOrders', () => {
    it('should call orderService.findMyOrders with userId and query', async () => {
      // Arrange
      const query = { page: 1, limit: 20 };
      const mockResult = {
        data: [],
        meta: { page: 1, limit: 20, total: 0, totalPages: 0 },
      };
      service.findMyOrders.mockResolvedValue(mockResult);

      // Act
      const result = await controller.findMyOrders(mockUser, query);

      // Assert
      expect(service.findMyOrders).toHaveBeenCalledWith(mockUser.id, query);
      expect(result).toEqual(mockResult);
    });
  });

  describe('findOne', () => {
    it('should call orderService.findMyOrderById with userId and orderId', async () => {
      // Arrange
      const mockResponse = { id: 1, status: 'pending' };
      service.findMyOrderById.mockResolvedValue(mockResponse as any);

      // Act
      const result = await controller.findOne(mockUser, 1);

      // Assert
      expect(service.findMyOrderById).toHaveBeenCalledWith(mockUser.id, 1);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('cancel', () => {
    it('should call orderService.cancelOrder with userId and orderId', async () => {
      // Arrange
      const mockResponse = { id: 1, status: 'cancelled' };
      service.cancelOrder.mockResolvedValue(mockResponse as any);

      // Act
      const result = await controller.cancel(mockUser, 1);

      // Assert
      expect(service.cancelOrder).toHaveBeenCalledWith(mockUser.id, 1);
      expect(result).toEqual(mockResponse);
    });
  });
});
