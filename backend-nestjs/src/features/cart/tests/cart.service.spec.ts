import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { CartService } from '../cart.service';
import { CartRepository } from '../repositories/cart.repository';
import { CartItemRepository } from '../repositories/cart-item.repository';
import { ProductService } from '../../product/product.service';
import { FlashSaleService } from '../../flash-sale/flash-sale.service';
import { CartEmptyException } from '../../../common/exceptions/cart-empty.exception';
import {
  mockCart,
  mockCartItem,
  mockCartWithItems,
  mockGuestCart,
} from './mocks/cart.mock';
import {
  mockProductVariant,
  mockProduct,
} from '../../product/tests/mocks/product.mock';

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
        {
          provide: FlashSaleService,
          useValue: {
            getActiveFlashPriceMap: jest.fn().mockResolvedValue(new Map()),
          },
        },
      ],
    }).compile();

    service = module.get<CartService>(CartService);
    cartRepository = module.get(CartRepository);
    cartItemRepository = module.get(CartItemRepository);
    productService = module.get(ProductService);
  });

  // ─── getCart ───

  describe('getCart', () => {
    it('should return empty cart when no cart exists for user', async () => {
      cartRepository.findByUserId.mockResolvedValue(null);

      const result = await service.getCart({ userId: 1 });

      expect(result).toEqual({ id: 0, items: [] });
      expect(cartRepository.findByUserId).toHaveBeenCalledWith(1);
    });

    it('should return empty cart when no cart exists for guest', async () => {
      cartRepository.findBySessionId.mockResolvedValue(null);

      const result = await service.getCart({ sessionId: 'guest-abc' });

      expect(result).toEqual({ id: 0, items: [] });
      expect(cartRepository.findBySessionId).toHaveBeenCalledWith('guest-abc');
    });

    it('should return cart with mapped items for authenticated user', async () => {
      const cart = mockCartWithItems(1);
      cartRepository.findByUserId.mockResolvedValue(cart);

      const result = await service.getCart({ userId: 1 });

      expect(result.id).toBe(cart.id);
      expect(result.items).toHaveLength(1);
      expect(result.items[0].variant.sku).toBe('SKU-1');
      expect(result.items[0].quantity).toBe(1);
    });

    it('should return null when owner has neither userId nor sessionId', async () => {
      const result = await service.getCart({});

      expect(result).toEqual({ id: 0, items: [] });
      expect(cartRepository.findByUserId).not.toHaveBeenCalled();
      expect(cartRepository.findBySessionId).not.toHaveBeenCalled();
    });
  });

  // ─── addItem ───

  describe('addItem', () => {
    const dto = { product_variant_id: 1, quantity: 2 };

    it('should add new item to existing cart', async () => {
      const variant = mockProductVariant({
        stock_quantity: 10,
        product: mockProduct(),
      });
      const cart = mockCart();
      const updatedCart = mockCartWithItems(1);

      productService.findVariantById.mockResolvedValue(variant);
      cartRepository.findByUserId
        .mockResolvedValueOnce(cart)
        .mockResolvedValueOnce(updatedCart);
      cartItemRepository.findByCartAndVariant.mockResolvedValue(null);
      cartItemRepository.create.mockResolvedValue(mockCartItem());

      const result = await service.addItem({ userId: 1 }, dto);

      expect(cartItemRepository.create).toHaveBeenCalledWith({
        cart_id: cart.id,
        product_variant_id: dto.product_variant_id,
        quantity: dto.quantity,
      });
      expect(result.id).toBe(updatedCart.id);
    });

    it('should increment quantity when variant already in cart', async () => {
      const variant = mockProductVariant({
        stock_quantity: 10,
        product: mockProduct(),
      });
      const existingItem = mockCartItem({ id: 5, quantity: 3 });
      const cart = mockCart();
      const updatedCart = mockCartWithItems(1);

      productService.findVariantById.mockResolvedValue(variant);
      cartRepository.findByUserId
        .mockResolvedValueOnce(cart)
        .mockResolvedValueOnce(updatedCart);
      cartItemRepository.findByCartAndVariant.mockResolvedValue(existingItem);

      await service.addItem({ userId: 1 }, dto);

      expect(cartItemRepository.updateQuantity).toHaveBeenCalledWith(5, 5);
      expect(cartItemRepository.create).not.toHaveBeenCalled();
    });

    it('should create new cart when none exists', async () => {
      const variant = mockProductVariant({
        stock_quantity: 10,
        product: mockProduct(),
      });
      const newCart = mockCart({ id: 99 });
      const updatedCart = mockCartWithItems(1);

      productService.findVariantById.mockResolvedValue(variant);
      cartRepository.findByUserId
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(updatedCart);
      cartRepository.create.mockResolvedValue(newCart);
      cartItemRepository.findByCartAndVariant.mockResolvedValue(null);
      cartItemRepository.create.mockResolvedValue(mockCartItem());

      await service.addItem({ userId: 1 }, dto);

      expect(cartRepository.create).toHaveBeenCalledWith({ user_id: 1 });
    });

    it('should create guest cart with session_id when no user', async () => {
      const variant = mockProductVariant({
        stock_quantity: 10,
        product: mockProduct(),
      });
      const guestCart = mockGuestCart({ id: 50 });
      const updatedCart = mockCartWithItems(1);

      productService.findVariantById.mockResolvedValue(variant);
      cartRepository.findBySessionId
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(updatedCart);
      cartRepository.create.mockResolvedValue(guestCart);
      cartItemRepository.findByCartAndVariant.mockResolvedValue(null);
      cartItemRepository.create.mockResolvedValue(mockCartItem());

      await service.addItem({ sessionId: 'guest-session-abc' }, dto);

      expect(cartRepository.create).toHaveBeenCalledWith({
        session_id: 'guest-session-abc',
      });
    });

    it('should throw NotFoundException when variant not found', async () => {
      productService.findVariantById.mockResolvedValue(null);

      await expect(service.addItem({ userId: 1 }, dto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException when product is inactive', async () => {
      const variant = mockProductVariant({
        stock_quantity: 10,
        product: mockProduct({ is_active: false }),
      });
      productService.findVariantById.mockResolvedValue(variant);

      await expect(service.addItem({ userId: 1 }, dto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException when variant out of stock', async () => {
      const variant = mockProductVariant({
        stock_quantity: 0,
        product: mockProduct(),
      });
      productService.findVariantById.mockResolvedValue(variant);

      await expect(service.addItem({ userId: 1 }, dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException when total quantity exceeds stock', async () => {
      const variant = mockProductVariant({
        stock_quantity: 5,
        product: mockProduct(),
      });
      const cart = mockCart();

      productService.findVariantById.mockResolvedValue(variant);
      cartRepository.findByUserId.mockResolvedValue(cart);
      cartItemRepository.findByCartAndVariant.mockResolvedValue(
        mockCartItem({ quantity: 4 }),
      );

      await expect(service.addItem({ userId: 1 }, dto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  // ─── updateItemQuantity ───

  describe('updateItemQuantity', () => {
    it('should update item quantity and return updated cart', async () => {
      const item = mockCartItem({
        id: 10,
        cart_id: 1,
        product_variant: mockProductVariant({
          stock_quantity: 20,
          product: mockProduct(),
        }),
      });
      const cart = mockCart({ id: 1 });
      const updatedCart = mockCartWithItems(1);

      cartItemRepository.findById.mockResolvedValue(item);
      cartRepository.findByUserId
        .mockResolvedValueOnce(cart)
        .mockResolvedValueOnce(updatedCart);

      const result = await service.updateItemQuantity({ userId: 1 }, 10, {
        quantity: 5,
      });

      expect(cartItemRepository.updateQuantity).toHaveBeenCalledWith(10, 5);
      expect(result.id).toBe(updatedCart.id);
    });

    it('should throw NotFoundException when item does not exist', async () => {
      cartItemRepository.findById.mockResolvedValue(null);

      await expect(
        service.updateItemQuantity({ userId: 1 }, 99, { quantity: 3 }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when item belongs to another cart', async () => {
      const item = mockCartItem({ id: 10, cart_id: 999 });
      const cart = mockCart({ id: 1 });

      cartItemRepository.findById.mockResolvedValue(item);
      cartRepository.findByUserId.mockResolvedValue(cart);

      await expect(
        service.updateItemQuantity({ userId: 1 }, 10, { quantity: 3 }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when user has no cart', async () => {
      const item = mockCartItem({ id: 10, cart_id: 1 });

      cartItemRepository.findById.mockResolvedValue(item);
      cartRepository.findByUserId.mockResolvedValue(null);

      await expect(
        service.updateItemQuantity({ userId: 1 }, 10, { quantity: 3 }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when quantity exceeds stock', async () => {
      const item = mockCartItem({
        id: 10,
        cart_id: 1,
        product_variant: mockProductVariant({
          stock_quantity: 3,
          product: mockProduct(),
        }),
      });
      const cart = mockCart({ id: 1 });

      cartItemRepository.findById.mockResolvedValue(item);
      cartRepository.findByUserId.mockResolvedValue(cart);

      await expect(
        service.updateItemQuantity({ userId: 1 }, 10, { quantity: 10 }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ─── removeItem ───

  describe('removeItem', () => {
    it('should remove item from cart', async () => {
      const item = mockCartItem({ id: 10, cart_id: 1 });
      const cart = mockCart({ id: 1 });

      cartItemRepository.findById.mockResolvedValue(item);
      cartRepository.findByUserId.mockResolvedValue(cart);

      await service.removeItem({ userId: 1 }, 10);

      expect(cartItemRepository.delete).toHaveBeenCalledWith(10);
    });

    it('should throw NotFoundException when item does not exist', async () => {
      cartItemRepository.findById.mockResolvedValue(null);

      await expect(service.removeItem({ userId: 1 }, 99)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException when item belongs to another cart', async () => {
      const item = mockCartItem({ id: 10, cart_id: 999 });
      const cart = mockCart({ id: 1 });

      cartItemRepository.findById.mockResolvedValue(item);
      cartRepository.findByUserId.mockResolvedValue(cart);

      await expect(service.removeItem({ userId: 1 }, 10)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ─── mergeCart ───

  describe('mergeCart', () => {
    it('should merge guest items into existing user cart', async () => {
      const guestItem = mockCartItem({
        id: 20,
        cart_id: 5,
        product_variant_id: 7,
        quantity: 3,
      });
      const guestCart = mockGuestCart({ id: 5, items: [guestItem] });
      const userCart = mockCart({ id: 1, items: [] });
      const mergedCart = mockCartWithItems(1);

      cartRepository.findBySessionId.mockResolvedValue(guestCart);
      cartRepository.findByUserId
        .mockResolvedValueOnce(userCart)
        .mockResolvedValueOnce(mergedCart);
      cartItemRepository.findByCartAndVariant.mockResolvedValue(null);
      cartItemRepository.create.mockResolvedValue(mockCartItem());

      const result = await service.mergeCart(1, {
        session_id: 'guest-session-abc',
      });

      expect(cartItemRepository.create).toHaveBeenCalledWith({
        cart_id: userCart.id,
        product_variant_id: 7,
        quantity: 3,
      });
      expect(cartItemRepository.deleteByCartId).toHaveBeenCalledWith(5);
      expect(cartRepository.delete).toHaveBeenCalledWith(5);
      expect(result.id).toBe(mergedCart.id);
    });

    it('should sum quantities when variant already exists in user cart', async () => {
      const guestItem = mockCartItem({
        id: 20,
        cart_id: 5,
        product_variant_id: 7,
        quantity: 2,
      });
      const guestCart = mockGuestCart({ id: 5, items: [guestItem] });
      const existingUserItem = mockCartItem({
        id: 3,
        cart_id: 1,
        product_variant_id: 7,
        quantity: 4,
      });
      const userCart = mockCart({ id: 1 });
      const mergedCart = mockCartWithItems(1);

      cartRepository.findBySessionId.mockResolvedValue(guestCart);
      cartRepository.findByUserId
        .mockResolvedValueOnce(userCart)
        .mockResolvedValueOnce(mergedCart);
      cartItemRepository.findByCartAndVariant.mockResolvedValue(
        existingUserItem,
      );

      await service.mergeCart(1, { session_id: 'guest-session-abc' });

      expect(cartItemRepository.updateQuantity).toHaveBeenCalledWith(3, 6);
      expect(cartItemRepository.create).not.toHaveBeenCalled();
    });

    it('should create user cart if none exists', async () => {
      const guestCart = mockGuestCart({ id: 5, items: [] });
      const newUserCart = mockCart({ id: 10 });
      const mergedCart = mockCart({ id: 10, items: [] });

      cartRepository.findBySessionId.mockResolvedValue(guestCart);
      cartRepository.findByUserId
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(mergedCart);
      cartRepository.create.mockResolvedValue(newUserCart);

      await service.mergeCart(1, { session_id: 'guest-session-abc' });

      expect(cartRepository.create).toHaveBeenCalledWith({ user_id: 1 });
    });

    it('should throw NotFoundException when guest cart not found', async () => {
      cartRepository.findBySessionId.mockResolvedValue(null);

      await expect(
        service.mergeCart(1, { session_id: 'nonexistent' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ─── getCartWithItems (cross-feature: consumed by order) ───

  describe('getCartWithItems', () => {
    it('should return cart with items', async () => {
      const cart = mockCartWithItems(2);
      cartRepository.findByUserId.mockResolvedValue(cart);

      const result = await service.getCartWithItems(1);

      expect(result).toBe(cart);
      expect(result.items).toHaveLength(2);
    });

    it('should throw CartEmptyException when cart is null', async () => {
      cartRepository.findByUserId.mockResolvedValue(null);

      await expect(service.getCartWithItems(1)).rejects.toThrow(
        CartEmptyException,
      );
    });

    it('should throw CartEmptyException when cart has no items', async () => {
      const emptyCart = mockCart({ items: [] });
      cartRepository.findByUserId.mockResolvedValue(emptyCart);

      await expect(service.getCartWithItems(1)).rejects.toThrow(
        CartEmptyException,
      );
    });
  });

  // ─── clearCart (cross-feature: consumed by order) ───

  describe('clearCart', () => {
    it('should delete cart items and cart', async () => {
      const cart = mockCart({ id: 5 });
      cartRepository.findByUserId.mockResolvedValue(cart);

      await service.clearCart(1);

      expect(cartItemRepository.deleteByCartId).toHaveBeenCalledWith(
        5,
        undefined,
      );
      expect(cartRepository.delete).toHaveBeenCalledWith(5, undefined);
    });

    it('should pass entity manager when provided', async () => {
      const cart = mockCart({ id: 5 });
      const mockManager = {} as any;
      cartRepository.findByUserId.mockResolvedValue(cart);

      await service.clearCart(1, mockManager);

      expect(cartItemRepository.deleteByCartId).toHaveBeenCalledWith(
        5,
        mockManager,
      );
      expect(cartRepository.delete).toHaveBeenCalledWith(5, mockManager);
    });

    it('should do nothing when user has no cart', async () => {
      cartRepository.findByUserId.mockResolvedValue(null);

      await service.clearCart(1);

      expect(cartItemRepository.deleteByCartId).not.toHaveBeenCalled();
      expect(cartRepository.delete).not.toHaveBeenCalled();
    });
  });
});
