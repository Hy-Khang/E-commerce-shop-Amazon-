import { Test, TestingModule } from '@nestjs/testing';
import { CanActivate, ExecutionContext, INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { CartController } from '../cart.controller';
import { CartService } from '../cart.service';
import { mockCartResponse } from './mocks/cart.mock';
import { APP_GUARD } from '@nestjs/core';

class MockJwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    if (req.headers.authorization === 'Bearer test-token') {
      req.user = { id: 1, email: 'test@test.com', role: 'customer' };
    }
    return true;
  }
}

describe('Cart (e2e)', () => {
  let app: INestApplication;
  let cartService: jest.Mocked<CartService>;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CartController],
      providers: [
        {
          provide: CartService,
          useValue: {
            getCart: jest.fn(),
            addItem: jest.fn(),
            updateItemQuantity: jest.fn(),
            removeItem: jest.fn(),
            mergeCart: jest.fn(),
          },
        },
        { provide: APP_GUARD, useClass: MockJwtAuthGuard },
      ],
    }).compile();

    app = module.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    await app.init();

    cartService = module.get(CartService);
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ─── Guest → Add Items → Login → Merge ───

  describe('Guest cart → merge on login', () => {
    it('should add items as guest then merge into user cart', async () => {
      const guestSessionId = 'guest-session-xyz';
      const guestCartResponse = mockCartResponse({ id: 50 });
      const mergedCartResponse = mockCartResponse({ id: 1 });

      // Step 1 — Guest adds item (no auth, uses session header)
      cartService.addItem.mockResolvedValue(guestCartResponse);

      const addRes = await request(app.getHttpServer())
        .post('/cart/items')
        .set('x-session-id', guestSessionId)
        .send({ product_variant_id: 5, quantity: 2 })
        .expect(201);

      expect(addRes.body.id).toBe(50);
      expect(cartService.addItem).toHaveBeenCalledWith(
        { sessionId: guestSessionId },
        expect.objectContaining({ product_variant_id: 5, quantity: 2 }),
      );

      // Step 2 — User logs in and merges guest cart (authenticated)
      cartService.mergeCart.mockResolvedValue(mergedCartResponse);

      const mergeRes = await request(app.getHttpServer())
        .post('/cart/merge')
        .set('Authorization', 'Bearer test-token')
        .send({ session_id: guestSessionId })
        .expect(201);

      expect(mergeRes.body.id).toBe(1);
      expect(cartService.mergeCart).toHaveBeenCalledWith(1, expect.objectContaining({ session_id: guestSessionId }));
    });
  });

  // ─── Add → Update → Remove flow ───

  describe('Cart item lifecycle: add → update → remove', () => {
    it('should add item, update quantity, then remove', async () => {
      const sessionId = 'guest-lifecycle';

      // Step 1 — Add item
      const afterAdd = mockCartResponse({
        items: [
          {
            id: 10,
            product_variant_id: 5,
            quantity: 1,
            shop_id: 1,
            shop_name: 'Test Shop',
            variant: {
              sku: 'SKU-1',
              price: 250000,
              sale_price: null,
              option1: 'Black',
              option2: 'M',
              option1_label: 'Color',
              option2_label: 'Size',
              stock_quantity: 100,
              product_name: 'Test Product',
              thumbnail_url: null,
            },
          },
        ],
      });
      cartService.addItem.mockResolvedValue(afterAdd);

      const addRes = await request(app.getHttpServer())
        .post('/cart/items')
        .set('x-session-id', sessionId)
        .send({ product_variant_id: 5, quantity: 1 })
        .expect(201);

      expect(addRes.body.items[0].quantity).toBe(1);

      // Step 2 — Update quantity
      const afterUpdate = mockCartResponse({
        items: [{ ...afterAdd.items[0], quantity: 5 }],
      });
      cartService.updateItemQuantity.mockResolvedValue(afterUpdate);

      const updateRes = await request(app.getHttpServer())
        .patch('/cart/items/10')
        .set('x-session-id', sessionId)
        .send({ quantity: 5 })
        .expect(200);

      expect(updateRes.body.items[0].quantity).toBe(5);

      // Step 3 — Remove item
      cartService.removeItem.mockResolvedValue(undefined);

      await request(app.getHttpServer())
        .delete('/cart/items/10')
        .set('x-session-id', sessionId)
        .expect(204);

      expect(cartService.removeItem).toHaveBeenCalledWith(
        { sessionId },
        10,
      );
    });
  });

  // ─── Validation ───

  describe('Request validation', () => {
    it('should return 400 when product_variant_id is missing on add', async () => {
      await request(app.getHttpServer())
        .post('/cart/items')
        .set('x-session-id', 'guest-123')
        .send({ quantity: 2 })
        .expect(400);
    });

    it('should return 400 when quantity is not positive on add', async () => {
      await request(app.getHttpServer())
        .post('/cart/items')
        .set('x-session-id', 'guest-123')
        .send({ product_variant_id: 5, quantity: 0 })
        .expect(400);
    });

    it('should return 400 when quantity is missing on update', async () => {
      await request(app.getHttpServer())
        .patch('/cart/items/1')
        .set('x-session-id', 'guest-123')
        .send({})
        .expect(400);
    });

    it('should return 400 when session_id is missing on merge', async () => {
      await request(app.getHttpServer())
        .post('/cart/merge')
        .set('Authorization', 'Bearer test-token')
        .send({})
        .expect(400);
    });

    it('should return 400 with no auth and no session header', async () => {
      await request(app.getHttpServer())
        .get('/cart')
        .expect(400);
    });
  });
});
