import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { WishlistService } from './wishlist.service';
import { AddWishlistItemDto } from './dto/add-wishlist-item.dto';
import { BulkCheckWishlistDto } from './dto/bulk-check-wishlist.dto';
import { WishlistQueryDto } from './dto/wishlist-query.dto';
import {
  WishlistItemResponseDto,
  WishlistCheckResponseDto,
  BulkCheckResponseDto,
} from './dto/wishlist-response.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { ICurrentUser } from '../../common/interfaces/current-user.interface';

@ApiTags('Wishlist')
@ApiBearerAuth()
@Controller()
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  @Post('wishlist')
  @ApiOperation({ summary: 'Add product to wishlist' })
  @ApiResponse({ status: 201, description: 'Product added to wishlist', type: WishlistItemResponseDto })
  @ApiResponse({ status: 404, description: 'WISHLIST_003: Product not found or inactive' })
  @ApiResponse({ status: 409, description: 'WISHLIST_001: Product already in wishlist' })
  async add(
    @CurrentUser() user: ICurrentUser,
    @Body() dto: AddWishlistItemDto,
  ) {
    return this.wishlistService.addToWishlist(user.id, dto);
  }

  @Delete('wishlist/:productId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove product from wishlist' })
  @ApiResponse({ status: 204, description: 'Product removed from wishlist' })
  @ApiResponse({ status: 404, description: 'WISHLIST_002: Product not in wishlist' })
  async remove(
    @CurrentUser() user: ICurrentUser,
    @Param('productId', ParseIntPipe) productId: number,
  ) {
    return this.wishlistService.removeFromWishlist(user.id, productId);
  }

  @Get('wishlist')
  @ApiOperation({ summary: 'List my wishlist (paginated)' })
  @ApiResponse({ status: 200, description: 'Returns paginated wishlist', type: [WishlistItemResponseDto] })
  async findAll(
    @CurrentUser() user: ICurrentUser,
    @Query() query: WishlistQueryDto,
  ) {
    return this.wishlistService.getMyWishlist(user.id, query);
  }

  @Get('wishlist/check/:productId')
  @ApiOperation({ summary: 'Check if product is in my wishlist' })
  @ApiResponse({ status: 200, description: 'Returns wishlist check result', type: WishlistCheckResponseDto })
  async check(
    @CurrentUser() user: ICurrentUser,
    @Param('productId', ParseIntPipe) productId: number,
  ) {
    return this.wishlistService.checkInWishlist(user.id, productId);
  }

  @Post('wishlist/check')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Bulk check multiple products in wishlist' })
  @ApiResponse({ status: 200, description: 'Returns map of product_id to boolean', type: BulkCheckResponseDto })
  async bulkCheck(
    @CurrentUser() user: ICurrentUser,
    @Body() dto: BulkCheckWishlistDto,
  ) {
    return this.wishlistService.bulkCheckInWishlist(user.id, dto);
  }
}
