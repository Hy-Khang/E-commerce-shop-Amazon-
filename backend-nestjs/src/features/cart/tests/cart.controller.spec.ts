import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { CartController } from '../cart.controller';
import { CartService } from '../cart.service';

describe('CartController', () => {
  let controller: CartController;
  let cartService: jest.Mocked<CartService>;

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

  describe('getCart', () => {
    it('should call cartService.getCart with userId when authenticated', async () => {
      // Arrange
      const user = { id: 1, email: 'test@test.com', role: 'customer' };
      const mockResponse = { id: 1, items: [] };
      cartService.getCart.mockResolvedValue(mockResponse);

      // Act
      const result = await controller.getCart(user, undefined);

      // Assert
      expect(cartService.getCart).toHaveBeenCalledWith({ userId: 1 });
      expect(result).toEqual(mockResponse);
    });

    it('should call cartService.getCart with sessionId for guest', async () => {
      // Arrange
      const mockResponse = { id: 2, items: [] };
      cartService.getCart.mockResolvedValue(mockResponse);

      // Act
      const result = await controller.getCart(undefined, 'guest-session-123');

      // Assert
      expect(cartService.getCart).toHaveBeenCalledWith({
        sessionId: 'guest-session-123',
      });
      expect(result).toEqual(mockResponse);
    });

    it('should throw BadRequestException when neither auth nor session_id', async () => {
      // Act & Assert
      await expect(
        controller.getCart(undefined, undefined),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('addItem', () => {
    it('should delegate to cartService.addItem', async () => {
      // Arrange
      const user = { id: 1, email: 'test@test.com', role: 'customer' };
      const dto = { product_variant_id: 5, quantity: 2 };
      const mockResponse = { id: 1, items: [] };
      cartService.addItem.mockResolvedValue(mockResponse);

      // Act
      const result = await controller.addItem(user, undefined, dto);

      // Assert
      expect(cartService.addItem).toHaveBeenCalledWith({ userId: 1 }, dto);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('mergeCart', () => {
    it('should delegate to cartService.mergeCart with user id', async () => {
      // Arrange
      const user = { id: 1, email: 'test@test.com', role: 'customer' };
      const dto = { session_id: 'guest-abc' };
      const mockResponse = { id: 1, items: [] };
      cartService.mergeCart.mockResolvedValue(mockResponse);

      // Act
      const result = await controller.mergeCart(user, dto);

      // Assert
      expect(cartService.mergeCart).toHaveBeenCalledWith(1, dto);
      expect(result).toEqual(mockResponse);
    });
  });
});
