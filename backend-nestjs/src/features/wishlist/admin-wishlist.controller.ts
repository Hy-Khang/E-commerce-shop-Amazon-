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
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Admin: Wishlist')
@ApiBearerAuth()
@Roles('admin')
@Controller('admin/wishlist')
export class AdminWishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  @Get('popular')
  @ApiOperation({ summary: 'Most wishlisted products (paginated)' })
  @ApiResponse({ status: 200, description: 'Returns paginated popular wishlist items', type: [PopularWishlistItemDto] })
  async getMostWishlisted(@Query() query: PaginationDto) {
    return this.wishlistService.getMostWishlisted(
      query.page || 1,
      query.limit || 20,
    );
  }
}
