import {
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiHeader,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { RecommendationsService } from './recommendations.service';
import { ActivityService } from './activity.service';
import { RecordActivityDto } from './dto/record-activity.dto';
import {
  ProductListResponseDto,
  RecommendationsResponseDto,
} from './dto/recommendation-response.dto';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { ICurrentUser } from '../../common/interfaces/current-user.interface';
import { RecommendationOwner } from './types/recommendations.types';

@ApiTags('Recommendations')
@Controller()
export class RecommendationsController {
  constructor(
    private readonly recommendationsService: RecommendationsService,
    private readonly activityService: ActivityService,
  ) {}

  @Public()
  @Post('activity')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Record a behavioral signal (best-effort)' })
  @ApiHeader({ name: 'x-session-id', required: false, description: 'Guest session ID' })
  @ApiResponse({ status: 204, description: 'Recorded (or silently ignored)' })
  async recordActivity(
    @CurrentUser() user: ICurrentUser | undefined,
    @Headers('x-session-id') sessionId: string | undefined,
    @Body() dto: RecordActivityDto,
  ): Promise<void> {
    await this.activityService.record(this.resolveOwner(user, sessionId), dto);
  }

  @Public()
  @Get('recommendations')
  @ApiOperation({ summary: 'Personalized "Recommended for You" set' })
  @ApiHeader({ name: 'x-session-id', required: false, description: 'Guest session ID' })
  @ApiResponse({ status: 200, type: RecommendationsResponseDto })
  async getRecommendations(
    @CurrentUser() user: ICurrentUser | undefined,
    @Headers('x-session-id') sessionId: string | undefined,
    @Query('limit', new DefaultValuePipe(12), ParseIntPipe) limit: number,
  ) {
    return this.recommendationsService.getRecommendations(
      this.resolveOwner(user, sessionId),
      limit,
    );
  }

  @Public()
  @Get('products/:id/similar')
  @ApiOperation({ summary: 'Similar products (content + co-view blend)' })
  @ApiResponse({ status: 200, type: ProductListResponseDto })
  async getSimilar(
    @Param('id', ParseIntPipe) id: number,
    @Query('limit', new DefaultValuePipe(12), ParseIntPipe) limit: number,
  ) {
    const products = await this.recommendationsService.getSimilar(id, limit);
    return { products };
  }

  @Public()
  @Get('products/:id/frequently-bought-together')
  @ApiOperation({ summary: 'Frequently bought together (co-purchase, falls back to similar)' })
  @ApiResponse({ status: 200, type: ProductListResponseDto })
  async getFrequentlyBoughtTogether(
    @Param('id', ParseIntPipe) id: number,
    @Query('limit', new DefaultValuePipe(12), ParseIntPipe) limit: number,
  ) {
    const products =
      await this.recommendationsService.getFrequentlyBoughtTogether(id, limit);
    return { products };
  }

  /** Customer (JWT) → user owner; guest → x-session-id; neither → null (lenient). */
  private resolveOwner(
    user: ICurrentUser | undefined,
    sessionId: string | undefined,
  ): RecommendationOwner | null {
    if (user?.id) return { userId: user.id, sessionId: null };
    if (sessionId) return { userId: null, sessionId };
    return null;
  }
}
