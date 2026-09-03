import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiHeader,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CartService } from './cart.service';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { MergeCartDto } from './dto/merge-cart.dto';
import { CartResponseDto } from './dto/cart-response.dto';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { ICurrentUser } from '../../common/interfaces/current-user.interface';
import { ICartOwner } from './types/cart.types';

@ApiTags('Cart')
@Controller()
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Public()
  @Get('cart')
  @ApiOperation({ summary: 'Get current cart with items + variant details' })
  @ApiHeader({
    name: 'x-session-id',
    required: false,
    description: 'Guest session ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns cart with items',
    type: CartResponseDto,
  })
  async getCart(
    @CurrentUser() user: ICurrentUser | undefined,
    @Headers('x-session-id') sessionId: string | undefined,
  ) {
    const owner = this.resolveCartOwner(user, sessionId);
    return this.cartService.getCart(owner);
  }

  @Public()
  @Post('cart/items')
  @ApiOperation({ summary: 'Add item to cart' })
  @ApiHeader({
    name: 'x-session-id',
    required: false,
    description: 'Guest session ID',
  })
  @ApiResponse({
    status: 201,
    description: 'Item added, returns updated cart',
    type: CartResponseDto,
  })
  @ApiResponse({ status: 404, description: 'PRODUCT_002: Variant not found' })
  @ApiResponse({
    status: 400,
    description: 'CART_003: Out of stock / CART_004: Exceeds stock',
  })
  async addItem(
    @CurrentUser() user: ICurrentUser | undefined,
    @Headers('x-session-id') sessionId: string | undefined,
    @Body() dto: AddCartItemDto,
  ) {
    const owner = this.resolveCartOwner(user, sessionId);
    return this.cartService.addItem(owner, dto);
  }

  @Public()
  @Patch('cart/items/:id')
  @ApiOperation({ summary: 'Update item quantity' })
  @ApiHeader({
    name: 'x-session-id',
    required: false,
    description: 'Guest session ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Quantity updated, returns updated cart',
    type: CartResponseDto,
  })
  @ApiResponse({ status: 404, description: 'CART_001: Cart item not found' })
  @ApiResponse({ status: 400, description: 'CART_004: Exceeds stock' })
  async updateItem(
    @CurrentUser() user: ICurrentUser | undefined,
    @Headers('x-session-id') sessionId: string | undefined,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCartItemDto,
  ) {
    const owner = this.resolveCartOwner(user, sessionId);
    return this.cartService.updateItemQuantity(owner, id, dto);
  }

  @Public()
  @Delete('cart/items/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove item from cart' })
  @ApiHeader({
    name: 'x-session-id',
    required: false,
    description: 'Guest session ID',
  })
  @ApiResponse({ status: 204, description: 'Item removed' })
  @ApiResponse({ status: 404, description: 'CART_001: Cart item not found' })
  async removeItem(
    @CurrentUser() user: ICurrentUser | undefined,
    @Headers('x-session-id') sessionId: string | undefined,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const owner = this.resolveCartOwner(user, sessionId);
    return this.cartService.removeItem(owner, id);
  }

  @Post('cart/merge')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Merge guest cart into user cart on login' })
  @ApiResponse({
    status: 200,
    description: 'Carts merged, returns merged cart',
    type: CartResponseDto,
  })
  @ApiResponse({ status: 404, description: 'CART_001: Guest cart not found' })
  async mergeCart(
    @CurrentUser() user: ICurrentUser,
    @Body() dto: MergeCartDto,
  ) {
    return this.cartService.mergeCart(user.id, dto);
  }

  private resolveCartOwner(
    user?: ICurrentUser,
    sessionId?: string,
  ): ICartOwner {
    if (user) return { userId: user.id };
    if (sessionId) return { sessionId };
    throw new BadRequestException(
      'Authentication or X-Session-Id header required',
    );
  }
}
