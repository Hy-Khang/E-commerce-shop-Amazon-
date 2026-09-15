import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { SellerApplicationService } from './seller-application.service';
import { SellerApplicationFilterDto } from './dto/seller-application-filter.dto';
import { RejectSellerApplicationDto } from './dto/reject-seller-application.dto';
import { SellerApplicationResponseDto } from './dto/seller-application-response.dto';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PERMISSIONS } from '../../common/constants/permissions.constant';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { ICurrentUser } from '../../common/interfaces/current-user.interface';

@ApiTags('Admin: Seller Applications')
@ApiBearerAuth()
@Controller('admin/seller-applications')
export class AdminSellerApplicationController {
  constructor(private readonly service: SellerApplicationService) {}

  @Get()
  @Permissions(PERMISSIONS.SELLER_APPLICATIONS_READ)
  @ApiOperation({ summary: 'List seller applications (paginated, ?status=)' })
  @ApiResponse({ status: 200, type: [SellerApplicationResponseDto] })
  async list(@Query() query: SellerApplicationFilterDto) {
    const result = await this.service.listForAdmin(query);
    return {
      data: result.data.map(SellerApplicationResponseDto.fromEntity),
      meta: result.meta,
    };
  }

  @Get(':id')
  @Permissions(PERMISSIONS.SELLER_APPLICATIONS_READ)
  @ApiOperation({ summary: 'Get a seller application detail' })
  @ApiResponse({ status: 200, type: SellerApplicationResponseDto })
  @ApiResponse({ status: 404, description: 'SELLER_APP_001' })
  async getOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<SellerApplicationResponseDto> {
    return SellerApplicationResponseDto.fromEntity(
      await this.service.getByIdForAdmin(id),
    );
  }

  @Patch(':id/approve')
  @Permissions(PERMISSIONS.SELLER_APPLICATIONS_UPDATE)
  @ApiOperation({
    summary: 'Approve — grant seller role + create active shop',
  })
  @ApiResponse({ status: 200, type: SellerApplicationResponseDto })
  @ApiResponse({ status: 400, description: 'SELLER_APP_004' })
  async approve(
    @CurrentUser() user: ICurrentUser,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<SellerApplicationResponseDto> {
    return SellerApplicationResponseDto.fromEntity(
      await this.service.approve(id, user.id),
    );
  }

  @Patch(':id/reject')
  @Permissions(PERMISSIONS.SELLER_APPLICATIONS_UPDATE)
  @ApiOperation({ summary: 'Reject an application (optional reason)' })
  @ApiResponse({ status: 200, type: SellerApplicationResponseDto })
  @ApiResponse({ status: 400, description: 'SELLER_APP_004' })
  async reject(
    @CurrentUser() user: ICurrentUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RejectSellerApplicationDto,
  ): Promise<SellerApplicationResponseDto> {
    return SellerApplicationResponseDto.fromEntity(
      await this.service.reject(id, user.id, dto.reject_reason),
    );
  }
}
