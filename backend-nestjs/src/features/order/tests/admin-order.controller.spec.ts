import { Test, TestingModule } from '@nestjs/testing';
import { AdminOrderController } from '../admin-order.controller';
import { OrderService } from '../order.service';
import { OrderStatus, PaymentStatus } from '../../../common/constants';

describe('AdminOrderController', () => {
  let controller: AdminOrderController;
  let service: jest.Mocked<OrderService>;

  beforeEach(async () => {
    const mockService = {
      findAllOrders: jest.fn(),
      findOrderById: jest.fn(),
      updateOrderStatus: jest.fn(),
      updatePaymentStatus: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminOrderController],
      providers: [{ provide: OrderService, useValue: mockService }],
    }).compile();

    controller = module.get(AdminOrderController);
    service = module.get(OrderService);
  });

  describe('findAll', () => {
    it('should call orderService.findAllOrders with query', async () => {
      // Arrange
      const query = { page: 1, limit: 20, status: OrderStatus.Pending };
      const mockResult = {
        data: [],
        meta: { page: 1, limit: 20, total: 0, totalPages: 0 },
      };
      service.findAllOrders.mockResolvedValue(mockResult as any);

      // Act
      const result = await controller.findAll(query as any);

      // Assert
      expect(service.findAllOrders).toHaveBeenCalledWith(query);
      expect(result).toEqual(mockResult);
    });
  });

  describe('findOne', () => {
    it('should call orderService.findOrderById with orderId', async () => {
      // Arrange
      const mockResponse = { id: 1, status: OrderStatus.Pending };
      service.findOrderById.mockResolvedValue(mockResponse as any);

      // Act
      const result = await controller.findOne(1);

      // Assert
      expect(service.findOrderById).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('updateStatus', () => {
    it('should call orderService.updateOrderStatus with orderId and dto', async () => {
      // Arrange
      const dto = { status: OrderStatus.Confirmed };
      const mockResponse = { id: 1, status: OrderStatus.Confirmed };
      service.updateOrderStatus.mockResolvedValue(mockResponse as any);

      // Act
      const mockUser = { id: 99, email: 'admin@test.com', role: 'admin' };
      const result = await controller.updateStatus(mockUser as any, 1, dto);

      // Assert
      expect(service.updateOrderStatus).toHaveBeenCalledWith(1, dto, 99);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('updatePaymentStatus', () => {
    it('should call orderService.updatePaymentStatus with orderId and dto', async () => {
      // Arrange
      const dto = { payment_status: PaymentStatus.Paid };
      const mockResponse = { id: 1, payment_status: PaymentStatus.Paid };
      service.updatePaymentStatus.mockResolvedValue(mockResponse as any);

      // Act
      const result = await controller.updatePaymentStatus(1, dto);

      // Assert
      expect(service.updatePaymentStatus).toHaveBeenCalledWith(1, dto);
      expect(result).toEqual(mockResponse);
    });
  });
});
