import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { WishlistService } from './wishlist.service';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { PopularWishlistItemDto } from './dto/wishlist-response.dto';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PERMISSIONS } from '../../common/constants/permissions.constant';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { ICurrentUser } from '../../common/interfaces/current-user.interface';

@ApiTags('Seller: Wishlist')
@ApiBearerAuth()
@Controller('seller/wishlist')
export class SellerWishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  @Get('popular')
  @Permissions(PERMISSIONS.WISHLIST_READ)
  @ApiOperation({
    summary: "Most wishlisted products in the seller's shop (paginated)",
  })
  @ApiResponse({
    status: 200,
    description: 'Returns paginated popular wishlist items',
    type: [PopularWishlistItemDto],
  })
  @ApiResponse({ status: 400, description: 'SHOP_004: Shop not set up' })
  async getMostWishlisted(
    @CurrentUser() user: ICurrentUser,
    @Query() query: PaginationDto,
  ) {
    return this.wishlistService.getShopMostWishlisted(
      user.id,
      query.page || 1,
      query.limit || 20,
    );
  }
}
