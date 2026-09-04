import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ReviewService } from './review.service';
import { ReviewQueryDto } from './dto/review-query.dto';
import { AdminReviewResponseDto } from './dto/review-response.dto';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PERMISSIONS } from '../../common/constants/permissions.constant';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { ICurrentUser } from '../../common/interfaces/current-user.interface';

@ApiTags('Seller: Reviews')
@ApiBearerAuth()
@Controller('seller/reviews')
export class SellerReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Get()
  @Permissions(PERMISSIONS.REVIEWS_READ)
  @ApiOperation({ summary: "List reviews for the seller's shop (paginated)" })
  @ApiResponse({
    status: 200,
    description: 'Returns paginated review list',
    type: [AdminReviewResponseDto],
  })
  @ApiResponse({ status: 400, description: 'SHOP_004: Shop not set up' })
  async findAll(
    @CurrentUser() user: ICurrentUser,
    @Query() query: ReviewQueryDto,
  ) {
    return this.reviewService.findSellerReviews(user.id, query);
  }
}
