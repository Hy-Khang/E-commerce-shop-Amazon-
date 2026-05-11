import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ReviewService } from './review.service';
import { ReviewQueryDto } from './dto/review-query.dto';
import { AdminReviewResponseDto } from './dto/review-response.dto';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Admin: Reviews')
@ApiBearerAuth()
@Roles('admin')
@Controller('admin/reviews')
export class AdminReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Get()
  @ApiOperation({ summary: 'List all reviews (paginated)' })
  @ApiResponse({ status: 200, description: 'Returns paginated review list', type: [AdminReviewResponseDto] })
  async findAll(@Query() query: ReviewQueryDto) {
    return this.reviewService.findAllReviews(query);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete any review (moderation)' })
  @ApiResponse({ status: 204, description: 'Review deleted' })
  @ApiResponse({ status: 404, description: 'COMMON_001: Review not found' })
  async delete(@Param('id', ParseIntPipe) id: number) {
    return this.reviewService.deleteReview(id);
  }
}
