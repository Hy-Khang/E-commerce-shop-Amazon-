import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { CartController } from '../cart.controller';
import { CartService } from '../cart.service';
import { mockCartResponse } from './mocks/cart.mock';

describe('CartController', () => {
  let controller: CartController;
  let cartService: jest.Mocked<CartService>;

  const mockUser = { id: 1, roleId: 1 };

  beforeEach(async () => {
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
      ],
    }).compile();

    controller = module.get<CartController>(CartController);
    cartService = module.get(CartService);
  });

  // ─── getCart ───

  describe('getCart', () => {
    it('should call cartService.getCart with userId when authenticated', async () => {
      const response = mockCartResponse();
      cartService.getCart.mockResolvedValue(response);

      const result = await controller.getCart(mockUser, undefined);

      expect(cartService.getCart).toHaveBeenCalledWith({ userId: 1 });
      expect(result).toEqual(response);
    });

    it('should call cartService.getCart with sessionId for guest', async () => {
      const response = mockCartResponse({ id: 2 });
      cartService.getCart.mockResolvedValue(response);

      const result = await controller.getCart(undefined, 'guest-session-123');

      expect(cartService.getCart).toHaveBeenCalledWith({
        sessionId: 'guest-session-123',
      });
      expect(result).toEqual(response);
    });

    it('should throw BadRequestException when neither auth nor session_id', async () => {
      await expect(controller.getCart(undefined, undefined)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  // ─── addItem ───

  describe('addItem', () => {
    const dto = { product_variant_id: 5, quantity: 2 };

    it('should delegate to cartService.addItem for authenticated user', async () => {
      const response = mockCartResponse();
      cartService.addItem.mockResolvedValue(response);

      const result = await controller.addItem(mockUser, undefined, dto);

      expect(cartService.addItem).toHaveBeenCalledWith({ userId: 1 }, dto);
      expect(result).toEqual(response);
    });

    it('should delegate to cartService.addItem for guest', async () => {
      const response = mockCartResponse();
      cartService.addItem.mockResolvedValue(response);

      const result = await controller.addItem(undefined, 'guest-abc', dto);

      expect(cartService.addItem).toHaveBeenCalledWith(
        { sessionId: 'guest-abc' },
        dto,
      );
      expect(result).toEqual(response);
    });

    it('should throw BadRequestException when no owner identified', async () => {
      await expect(
        controller.addItem(undefined, undefined, dto),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ─── updateItem ───

  describe('updateItem', () => {
    const dto = { quantity: 5 };

    it('should delegate to cartService.updateItemQuantity', async () => {
      const response = mockCartResponse();
      cartService.updateItemQuantity.mockResolvedValue(response);

      const result = await controller.updateItem(mockUser, undefined, 10, dto);

      expect(cartService.updateItemQuantity).toHaveBeenCalledWith(
        { userId: 1 },
        10,
        dto,
      );
      expect(result).toEqual(response);
    });

    it('should work for guest session', async () => {
      const response = mockCartResponse();
      cartService.updateItemQuantity.mockResolvedValue(response);

      const result = await controller.updateItem(
        undefined,
        'guest-abc',
        10,
        dto,
      );

      expect(cartService.updateItemQuantity).toHaveBeenCalledWith(
        { sessionId: 'guest-abc' },
        10,
        dto,
      );
      expect(result).toEqual(response);
    });
  });

  // ─── removeItem ───

  describe('removeItem', () => {
    it('should delegate to cartService.removeItem', async () => {
      cartService.removeItem.mockResolvedValue(undefined);

      await controller.removeItem(mockUser, undefined, 10);

      expect(cartService.removeItem).toHaveBeenCalledWith({ userId: 1 }, 10);
    });

    it('should work for guest session', async () => {
      cartService.removeItem.mockResolvedValue(undefined);

      await controller.removeItem(undefined, 'guest-abc', 10);

      expect(cartService.removeItem).toHaveBeenCalledWith(
        { sessionId: 'guest-abc' },
        10,
      );
    });
  });

  // ─── mergeCart ───

  describe('mergeCart', () => {
    it('should delegate to cartService.mergeCart with user id', async () => {
      const dto = { session_id: 'guest-abc' };
      const response = mockCartResponse();
      cartService.mergeCart.mockResolvedValue(response);

      const result = await controller.mergeCart(mockUser, dto);

      expect(cartService.mergeCart).toHaveBeenCalledWith(1, dto);
      expect(result).toEqual(response);
    });
  });
});
