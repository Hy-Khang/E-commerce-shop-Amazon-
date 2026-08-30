import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { RecentlyViewedService } from './recently-viewed.service';
import { RecordViewDto } from './dto/record-view.dto';
import { MergeRecentlyViewedDto } from './dto/merge-recently-viewed.dto';
import { ProductResponseDto } from '../product/dto/product-response.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { ICurrentUser } from '../../common/interfaces/current-user.interface';

@ApiTags('Recently Viewed')
@ApiBearerAuth()
@Controller()
export class RecentlyViewedController {
  constructor(private readonly recentlyViewedService: RecentlyViewedService) {}

  @Get('recently-viewed')
  @ApiOperation({
    summary: 'List my recently-viewed products (newest first, max 20)',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns recently-viewed products',
    type: [ProductResponseDto],
  })
  async findAll(@CurrentUser() user: ICurrentUser) {
    return this.recentlyViewedService.getRecentlyViewed(user.id);
  }

  @Post('recently-viewed')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Record a product view' })
  @ApiResponse({ status: 204, description: 'View recorded' })
  @ApiResponse({
    status: 404,
    description: 'PRODUCT_001: Product not found or inactive',
  })
  async record(@CurrentUser() user: ICurrentUser, @Body() dto: RecordViewDto) {
    await this.recentlyViewedService.recordView(user.id, dto.product_id);
  }

  @Post('recently-viewed/merge')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Merge guest (localStorage) view history into my history',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns merged recently-viewed products',
    type: [ProductResponseDto],
  })
  async merge(
    @CurrentUser() user: ICurrentUser,
    @Body() dto: MergeRecentlyViewedDto,
  ) {
    return this.recentlyViewedService.merge(user.id, dto);
  }
}
