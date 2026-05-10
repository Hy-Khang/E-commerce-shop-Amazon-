import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { CartService } from '../cart.service';
import { CartRepository } from '../repositories/cart.repository';
import { CartItemRepository } from '../repositories/cart-item.repository';
import { ProductService } from '../../product/product.service';

describe('CartService', () => {
  let service: CartService;
  let cartRepository: jest.Mocked<CartRepository>;
  let cartItemRepository: jest.Mocked<CartItemRepository>;
  let productService: jest.Mocked<ProductService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CartService,
        {
          provide: CartRepository,
          useValue: {
            findByUserId: jest.fn(),
            findBySessionId: jest.fn(),
            create: jest.fn(),
            delete: jest.fn(),
          },
        },
        {
          provide: CartItemRepository,
          useValue: {
            findById: jest.fn(),
            findByCartAndVariant: jest.fn(),
            create: jest.fn(),
            updateQuantity: jest.fn(),
            delete: jest.fn(),
            deleteByCartId: jest.fn(),
          },
        },
        {
          provide: ProductService,
          useValue: {
            findVariantById: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<CartService>(CartService);
    cartRepository = module.get(CartRepository);
    cartItemRepository = module.get(CartItemRepository);
    productService = module.get(ProductService);
  });

  describe('getCart', () => {
    it('should return empty cart when no cart exists', async () => {
      // Arrange
      cartRepository.findByUserId.mockResolvedValue(null);

      // Act
      const result = await service.getCart({ userId: 1 });

      // Assert
      expect(result).toEqual({ id: 0, items: [] });
    });

    it('should return cart with items for authenticated user', async () => {
      // Arrange
      const mockCart = {
        id: 1,
        user_id: 1,
        session_id: null,
        created_at: new Date(),
        user: null as any,
        items: [
          {
            id: 1,
            cart_id: 1,
            product_variant_id: 5,
            quantity: 2,
            cart: null as any,
            product_variant: {
              id: 5,
              sku: 'TEST-SKU',
              price: 100,
              sale_price: null,
              color: 'Red',
              size: 'M',
              stock_quantity: 10,
              product_id: 1,
              product: { id: 1, name: 'Test Product', thumbnail_url: 'img.jpg' },
            },
          },
        ],
      };
      cartRepository.findByUserId.mockResolvedValue(mockCart as any);

      // Act
      const result = await service.getCart({ userId: 1 });

      // Assert
      expect(result.id).toBe(1);
      expect(result.items).toHaveLength(1);
      expect(result.items[0].variant.sku).toBe('TEST-SKU');
    });
  });

  describe('addItem', () => {
    it('should throw NotFoundException when variant not found', async () => {
      // Arrange
      productService.findVariantById.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.addItem({ userId: 1 }, { product_variant_id: 99, quantity: 1 }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when variant out of stock', async () => {
      // Arrange
      productService.findVariantById.mockResolvedValue({
        id: 1,
        stock_quantity: 0,
        product: { is_active: true },
      } as any);

      // Act & Assert
      await expect(
        service.addItem({ userId: 1 }, { product_variant_id: 1, quantity: 1 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when quantity exceeds stock', async () => {
      // Arrange
      productService.findVariantById.mockResolvedValue({
        id: 1,
        stock_quantity: 5,
        product: { is_active: true },
      } as any);
      cartRepository.findByUserId.mockResolvedValue({
        id: 1,
        items: [],
      } as any);
      cartItemRepository.findByCartAndVariant.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.addItem({ userId: 1 }, { product_variant_id: 1, quantity: 10 }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('removeItem', () => {
    it('should throw NotFoundException when item does not exist', async () => {
      // Arrange
      cartItemRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.removeItem({ userId: 1 }, 99),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when item belongs to another cart', async () => {
      // Arrange
      cartItemRepository.findById.mockResolvedValue({
        id: 1,
        cart_id: 2,
      } as any);
      cartRepository.findByUserId.mockResolvedValue({
        id: 1,
        items: [],
      } as any);

      // Act & Assert
      await expect(
        service.removeItem({ userId: 1 }, 1),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('mergeCart', () => {
    it('should throw NotFoundException when guest cart not found', async () => {
      // Arrange
      cartRepository.findBySessionId.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.mergeCart(1, { session_id: 'nonexistent' }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
