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
import { ReviewService } from './review.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { ReviewQueryDto } from './dto/review-query.dto';
import {
  ReviewResponseDto,
  ReviewWithUserResponseDto,
} from './dto/review-response.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import type { ICurrentUser } from '../../common/interfaces/current-user.interface';

@ApiTags('Review')
@ApiBearerAuth()
@Controller()
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Post('reviews')
  @ApiOperation({ summary: 'Create review (purchase-verified)' })
  @ApiResponse({ status: 201, description: 'Review created', type: ReviewResponseDto })
  @ApiResponse({ status: 403, description: 'REVIEW_001: Product not purchased' })
  @ApiResponse({ status: 409, description: 'REVIEW_002: Duplicate review' })
  async create(
    @CurrentUser() user: ICurrentUser,
    @Body() dto: CreateReviewDto,
  ) {
    return this.reviewService.createReview(user.id, dto);
  }

  @Public()
  @Get('products/:productId/reviews')
  @ApiOperation({ summary: 'List reviews for a product (paginated)' })
  @ApiResponse({ status: 200, description: 'Returns paginated review list', type: [ReviewWithUserResponseDto] })
  async findProductReviews(
    @Param('productId', ParseIntPipe) productId: number,
    @Query() query: ReviewQueryDto,
  ) {
    return this.reviewService.findProductReviews(productId, query);
  }

  @Get('reviews/me')
  @ApiOperation({ summary: 'List my reviews (paginated)' })
  @ApiResponse({ status: 200, description: 'Returns paginated review list', type: [ReviewResponseDto] })
  async findMyReviews(
    @CurrentUser() user: ICurrentUser,
    @Query() query: ReviewQueryDto,
  ) {
    return this.reviewService.findMyReviews(user.id, query);
  }

  @Delete('reviews/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete own review' })
  @ApiResponse({ status: 204, description: 'Review deleted' })
  @ApiResponse({ status: 403, description: 'Review does not belong to user' })
  @ApiResponse({ status: 404, description: 'COMMON_001: Review not found' })
  async deleteMyReview(
    @CurrentUser() user: ICurrentUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.reviewService.deleteMyReview(user.id, id);
  }
}
