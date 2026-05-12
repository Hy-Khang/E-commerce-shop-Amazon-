import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { CartRepository } from './repositories/cart.repository';
import { CartItemRepository } from './repositories/cart-item.repository';
import { ProductService } from '../product/product.service';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { MergeCartDto } from './dto/merge-cart.dto';
import { CartResponseDto } from './dto/cart-response.dto';
import { Cart } from './entities/cart.entity';
import { ICartOwner } from './types/cart.types';
import { CartEmptyException } from '../../common/exceptions/cart-empty.exception';
import { toCartResponse } from './utils/cart.util';

@Injectable()
export class CartService {
  private readonly logger = new Logger(CartService.name);

  constructor(
    private readonly cartRepository: CartRepository,
    private readonly cartItemRepository: CartItemRepository,
    private readonly productService: ProductService,
  ) {}

  // ─── Customer / Guest endpoints ───

  async getCart(owner: ICartOwner): Promise<CartResponseDto> {
    const cart = await this.findCart(owner);
    if (!cart) {
      return { id: 0, items: [] };
    }
    return toCartResponse(cart);
  }

  async addItem(owner: ICartOwner, dto: AddCartItemDto): Promise<CartResponseDto> {
    const variant = await this.productService.findVariantById(dto.product_variant_id);
    if (!variant || !variant.product?.is_active) {
      throw new NotFoundException({
        code: 'PRODUCT_002',
        message: 'Variant not found',
      });
    }

    if (variant.stock_quantity <= 0) {
      throw new BadRequestException({
        code: 'CART_003',
        message: 'Variant out of stock',
      });
    }

    let cart = await this.findCart(owner);
    if (!cart) {
      cart = await this.cartRepository.create(
        owner.userId
          ? { user_id: owner.userId }
          : { session_id: owner.sessionId },
      );
    }

    const existingItem = await this.cartItemRepository.findByCartAndVariant(
      cart.id,
      dto.product_variant_id,
    );

    const newQuantity = existingItem
      ? existingItem.quantity + dto.quantity
      : dto.quantity;

    if (newQuantity > variant.stock_quantity) {
      throw new BadRequestException({
        code: 'CART_004',
        message: 'Requested quantity exceeds stock',
      });
    }

    if (existingItem) {
      await this.cartItemRepository.updateQuantity(existingItem.id, newQuantity);
    } else {
      await this.cartItemRepository.create({
        cart_id: cart.id,
        product_variant_id: dto.product_variant_id,
        quantity: dto.quantity,
      });
    }

    const updatedCart = await this.findCart(owner);
    this.logger.log(
      `Item added to cart ${cart.id}: variant ${dto.product_variant_id} x${dto.quantity}`,
    );
    return toCartResponse(updatedCart!);
  }

  async updateItemQuantity(
    owner: ICartOwner,
    itemId: number,
    dto: UpdateCartItemDto,
  ): Promise<CartResponseDto> {
    const item = await this.cartItemRepository.findById(itemId);
    if (!item) {
      throw new NotFoundException({
        code: 'CART_001',
        message: 'Cart item not found',
      });
    }

    const cart = await this.findCart(owner);
    if (!cart || item.cart_id !== cart.id) {
      throw new NotFoundException({
        code: 'CART_001',
        message: 'Cart item not found',
      });
    }

    if (dto.quantity > item.product_variant.stock_quantity) {
      throw new BadRequestException({
        code: 'CART_004',
        message: 'Requested quantity exceeds stock',
      });
    }

    await this.cartItemRepository.updateQuantity(itemId, dto.quantity);

    const updatedCart = await this.findCart(owner);
    this.logger.log(`Cart item ${itemId} quantity updated to ${dto.quantity}`);
    return toCartResponse(updatedCart!);
  }

  async removeItem(owner: ICartOwner, itemId: number): Promise<void> {
    const item = await this.cartItemRepository.findById(itemId);
    if (!item) {
      throw new NotFoundException({
        code: 'CART_001',
        message: 'Cart item not found',
      });
    }

    const cart = await this.findCart(owner);
    if (!cart || item.cart_id !== cart.id) {
      throw new NotFoundException({
        code: 'CART_001',
        message: 'Cart item not found',
      });
    }

    await this.cartItemRepository.delete(itemId);
    this.logger.log(`Cart item ${itemId} removed from cart ${cart.id}`);
  }

  async mergeCart(userId: number, dto: MergeCartDto): Promise<CartResponseDto> {
    const guestCart = await this.cartRepository.findBySessionId(dto.session_id);
    if (!guestCart) {
      throw new NotFoundException({
        code: 'CART_001',
        message: 'Cart not found',
      });
    }

    let userCart = await this.cartRepository.findByUserId(userId);
    if (!userCart) {
      userCart = await this.cartRepository.create({ user_id: userId });
    }

    for (const guestItem of guestCart.items || []) {
      const existingItem = await this.cartItemRepository.findByCartAndVariant(
        userCart.id,
        guestItem.product_variant_id,
      );

      if (existingItem) {
        await this.cartItemRepository.updateQuantity(
          existingItem.id,
          existingItem.quantity + guestItem.quantity,
        );
      } else {
        await this.cartItemRepository.create({
          cart_id: userCart.id,
          product_variant_id: guestItem.product_variant_id,
          quantity: guestItem.quantity,
        });
      }
    }

    await this.cartItemRepository.deleteByCartId(guestCart.id);
    await this.cartRepository.delete(guestCart.id);

    const mergedCart = await this.cartRepository.findByUserId(userId);
    this.logger.log(
      `Guest cart ${guestCart.id} merged into user cart ${mergedCart!.id}`,
    );
    return toCartResponse(mergedCart!);
  }

  // ─── Cross-feature: consumed by order ───

  async getCartWithItems(userId: number): Promise<Cart> {
    const cart = await this.cartRepository.findByUserId(userId);
    if (!cart || !cart.items?.length) {
      throw new CartEmptyException();
    }
    return cart;
  }

  async clearCart(userId: number, manager?: EntityManager): Promise<void> {
    const cart = await this.cartRepository.findByUserId(userId);
    if (cart) {
      await this.cartItemRepository.deleteByCartId(cart.id, manager);
      await this.cartRepository.delete(cart.id, manager);
    }
  }

  // ─── Private helpers ───

  private async findCart(owner: ICartOwner): Promise<Cart | null> {
    if (owner.userId) {
      return this.cartRepository.findByUserId(owner.userId);
    }
    if (owner.sessionId) {
      return this.cartRepository.findBySessionId(owner.sessionId);
    }
    return null;
  }
}
