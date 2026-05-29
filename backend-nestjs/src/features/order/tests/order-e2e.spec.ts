import { Test, TestingModule } from '@nestjs/testing';
import {
  CanActivate,
  ExecutionContext,
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import request from 'supertest';
import { OrderController } from '../order.controller';
import { AdminOrderController } from '../admin-order.controller';
import { OrderService } from '../order.service';
import { PaymentMethod, OrderStatus, PaymentStatus } from '../../../common/constants';
import { APP_GUARD } from '@nestjs/core';

class MockJwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    if (req.headers.authorization === 'Bearer admin-token') {
      req.user = { id: 1, email: 'admin@test.com', role: 'admin' };
    } else if (req.headers.authorization === 'Bearer customer-token') {
      req.user = { id: 2, email: 'customer@test.com', role: 'customer' };
    }
    return true;
  }
}

describe('Order (e2e)', () => {
  let app: INestApplication;
  let orderService: jest.Mocked<OrderService>;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrderController, AdminOrderController],
      providers: [
        {
          provide: OrderService,
          useValue: {
            checkout: jest.fn(),
            findMyOrders: jest.fn(),
            findMyOrderById: jest.fn(),
            cancelOrder: jest.fn(),
            findAllOrders: jest.fn(),
            findOrderById: jest.fn(),
            updateOrderStatus: jest.fn(),
            updatePaymentStatus: jest.fn(),
          },
        },
        { provide: APP_GUARD, useClass: MockJwtAuthGuard },
      ],
    }).compile();

    app = module.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();

    orderService = module.get(OrderService);
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ─── Customer: Checkout flow ───

  describe('POST /orders (checkout)', () => {
    const checkoutDto = {
      payment_method: PaymentMethod.Cod,
      address_id: 5,
    };

    it('should create order and return 201', async () => {
      // Arrange
      const orderResponse = {
        id: 42,
        status: 'pending',
        payment_method: 'cod',
        payment_status: 'unpaid',
        shipping_fee: 30000,
        total_amount: 530000,
        shipping_address: {
          full_name: 'Nguyen Van A',
          phone: '0901234567',
          address_line: '123 Le Loi',
          city: 'Ho Chi Minh',
        },
        order_items: [
          {
            id: 1,
            product_name: 'Test Product',
            sku: 'SKU-1',
            price: 250000,
            quantity: 2,
            thumbnail_url: null,
          },
        ],
        created_at: new Date().toISOString(),
      };
      orderService.checkout.mockResolvedValue(orderResponse as any);

      // Act
      const res = await request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', 'Bearer customer-token')
        .send(checkoutDto)
        .expect(201);

      // Assert
      expect(res.body.id).toBe(42);
      expect(res.body.status).toBe('pending');
      expect(orderService.checkout).toHaveBeenCalledWith(
        2,
        expect.objectContaining({
          payment_method: 'cod',
          address_id: 5,
        }),
      );
    });

    it('should return 400 when payment_method is invalid', async () => {
      await request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', 'Bearer customer-token')
        .send({ payment_method: 'bitcoin', address_id: 5 })
        .expect(400);
    });

    it('should return 400 when address_id is missing', async () => {
      await request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', 'Bearer customer-token')
        .send({ payment_method: 'cod' })
        .expect(400);
    });

    it('should return 400 when address_id is not positive', async () => {
      await request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', 'Bearer customer-token')
        .send({ payment_method: 'cod', address_id: -1 })
        .expect(400);
    });

    it('should return 400 with extra unknown fields', async () => {
      await request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', 'Bearer customer-token')
        .send({ ...checkoutDto, hacker_field: 'xss' })
        .expect(400);
    });
  });

  // ─── Customer: List + detail ───

  describe('GET /orders', () => {
    it('should return paginated order list', async () => {
      // Arrange
      const mockResult = {
        data: [{ id: 1, status: 'pending', total_amount: 500000 }],
        meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
      };
      orderService.findMyOrders.mockResolvedValue(mockResult as any);

      // Act
      const res = await request(app.getHttpServer())
        .get('/orders')
        .set('Authorization', 'Bearer customer-token')
        .expect(200);

      // Assert
      expect(res.body.data).toHaveLength(1);
      expect(orderService.findMyOrders).toHaveBeenCalledWith(
        2,
        expect.any(Object),
      );
    });
  });

  describe('GET /orders/:id', () => {
    it('should return order detail', async () => {
      // Arrange
      const orderResponse = { id: 1, status: 'pending' };
      orderService.findMyOrderById.mockResolvedValue(orderResponse as any);

      // Act
      const res = await request(app.getHttpServer())
        .get('/orders/1')
        .set('Authorization', 'Bearer customer-token')
        .expect(200);

      // Assert
      expect(res.body.id).toBe(1);
      expect(orderService.findMyOrderById).toHaveBeenCalledWith(2, 1);
    });
  });

  // ─── Customer: Cancel flow ───

  describe('PATCH /orders/:id/cancel', () => {
    it('should cancel a pending order', async () => {
      // Arrange
      const cancelledOrder = { id: 1, status: 'cancelled' };
      orderService.cancelOrder.mockResolvedValue(cancelledOrder as any);

      // Act
      const res = await request(app.getHttpServer())
        .patch('/orders/1/cancel')
        .set('Authorization', 'Bearer customer-token')
        .expect(200);

      // Assert
      expect(res.body.status).toBe('cancelled');
      expect(orderService.cancelOrder).toHaveBeenCalledWith(2, 1);
    });
  });

  // ─── Admin: Order management ───

  describe('GET /admin/orders', () => {
    it('should return all orders paginated', async () => {
      // Arrange
      const mockResult = {
        data: [{ id: 1, status: 'pending' }],
        meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
      };
      orderService.findAllOrders.mockResolvedValue(mockResult as any);

      // Act
      const res = await request(app.getHttpServer())
        .get('/admin/orders')
        .set('Authorization', 'Bearer admin-token')
        .expect(200);

      // Assert
      expect(res.body.data).toHaveLength(1);
    });
  });

  describe('GET /admin/orders/:id', () => {
    it('should return order detail with user info', async () => {
      // Arrange
      const adminOrder = {
        id: 1,
        status: 'pending',
        user_id: 2,
        user_email: 'customer@test.com',
      };
      orderService.findOrderById.mockResolvedValue(adminOrder as any);

      // Act
      const res = await request(app.getHttpServer())
        .get('/admin/orders/1')
        .set('Authorization', 'Bearer admin-token')
        .expect(200);

      // Assert
      expect(res.body.user_email).toBe('customer@test.com');
    });
  });

  describe('PATCH /admin/orders/:id/status', () => {
    it('should update order status with valid transition', async () => {
      // Arrange
      const updatedOrder = { id: 1, status: OrderStatus.Confirmed };
      orderService.updateOrderStatus.mockResolvedValue(updatedOrder as any);

      // Act
      const res = await request(app.getHttpServer())
        .patch('/admin/orders/1/status')
        .set('Authorization', 'Bearer admin-token')
        .send({ status: OrderStatus.Confirmed })
        .expect(200);

      // Assert
      expect(res.body.status).toBe('confirmed');
    });

    it('should return 400 when status value is invalid', async () => {
      await request(app.getHttpServer())
        .patch('/admin/orders/1/status')
        .set('Authorization', 'Bearer admin-token')
        .send({ status: 'nonexistent' })
        .expect(400);
    });
  });

  describe('PATCH /admin/orders/:id/payment-status', () => {
    it('should update payment status', async () => {
      // Arrange
      const updatedOrder = { id: 1, payment_status: PaymentStatus.Paid };
      orderService.updatePaymentStatus.mockResolvedValue(updatedOrder as any);

      // Act
      const res = await request(app.getHttpServer())
        .patch('/admin/orders/1/payment-status')
        .set('Authorization', 'Bearer admin-token')
        .send({ payment_status: PaymentStatus.Paid })
        .expect(200);

      // Assert
      expect(res.body.payment_status).toBe('paid');
    });

    it('should return 400 when payment_status is invalid', async () => {
      await request(app.getHttpServer())
        .patch('/admin/orders/1/payment-status')
        .set('Authorization', 'Bearer admin-token')
        .send({ payment_status: 'crypto' })
        .expect(400);
    });
  });

  // ─── Full checkout → cancel flow ───

  describe('Checkout → Cancel flow', () => {
    it('should checkout then cancel the order', async () => {
      // Step 1 — Checkout
      const createdOrder = {
        id: 100,
        status: 'pending',
        payment_method: 'cod',
        payment_status: 'unpaid',
        total_amount: 500000,
      };
      orderService.checkout.mockResolvedValue(createdOrder as any);

      const checkoutRes = await request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', 'Bearer customer-token')
        .send({ payment_method: 'cod', address_id: 5 })
        .expect(201);

      expect(checkoutRes.body.id).toBe(100);
      expect(checkoutRes.body.status).toBe('pending');

      // Step 2 — Cancel
      const cancelledOrder = { ...createdOrder, status: 'cancelled' };
      orderService.cancelOrder.mockResolvedValue(cancelledOrder as any);

      const cancelRes = await request(app.getHttpServer())
        .patch('/orders/100/cancel')
        .set('Authorization', 'Bearer customer-token')
        .expect(200);

      expect(cancelRes.body.status).toBe('cancelled');
    });
  });

  // ─── Admin: Full status lifecycle ───

  describe('Admin status lifecycle: pending → confirmed → shipping → delivered', () => {
    it('should transition through all valid statuses', async () => {
      const transitions = [
        { from: OrderStatus.Pending, to: OrderStatus.Confirmed },
        { from: OrderStatus.Confirmed, to: OrderStatus.Shipping },
        { from: OrderStatus.Shipping, to: OrderStatus.Delivered },
      ];

      for (const { from, to } of transitions) {
        orderService.updateOrderStatus.mockResolvedValue({
          id: 1,
          status: to,
        } as any);

        const res = await request(app.getHttpServer())
          .patch('/admin/orders/1/status')
          .set('Authorization', 'Bearer admin-token')
          .send({ status: to })
          .expect(200);

        expect(res.body.status).toBe(to);
      }
    });
  });
});
