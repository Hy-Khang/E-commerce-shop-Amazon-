import { Body, Controller, Get, Post } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { SellerApplicationService } from './seller-application.service';
import { CreateSellerApplicationDto } from './dto/create-seller-application.dto';
import { SellerApplicationResponseDto } from './dto/seller-application-response.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { ICurrentUser } from '../../common/interfaces/current-user.interface';

@ApiTags('Seller Applications')
@ApiBearerAuth()
@Controller('seller-applications')
export class SellerApplicationController {
  constructor(private readonly service: SellerApplicationService) {}

  @Post()
  @ApiOperation({ summary: 'Submit a seller onboarding application' })
  @ApiResponse({ status: 201, type: SellerApplicationResponseDto })
  @ApiResponse({ status: 409, description: 'SELLER_APP_002 / SELLER_APP_003' })
  async apply(
    @CurrentUser() user: ICurrentUser,
    @Body() dto: CreateSellerApplicationDto,
  ): Promise<SellerApplicationResponseDto> {
    const application = await this.service.apply(user.id, user.roleId, dto);
    return SellerApplicationResponseDto.fromEntity(application);
  }

  @Get('me')
  @ApiOperation({ summary: 'My latest seller application (null if none)' })
  @ApiResponse({ status: 200, type: SellerApplicationResponseDto })
  async getMine(
    @CurrentUser() user: ICurrentUser,
  ): Promise<SellerApplicationResponseDto | null> {
    const application = await this.service.getMine(user.id);
    return application
      ? SellerApplicationResponseDto.fromEntity(application)
      : null;
  }
}
