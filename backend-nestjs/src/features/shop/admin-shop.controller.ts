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
import { ShopService } from './shop.service';
import { ShopQueryDto } from './dto/shop-query.dto';
import { UpdateShopStatusDto } from './dto/update-shop-status.dto';
import { AdminShopResponseDto, ShopResponseDto } from './dto/shop-response.dto';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PERMISSIONS } from '../../common/constants/permissions.constant';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { ICurrentUser } from '../../common/interfaces/current-user.interface';

@ApiTags('Admin: Shops')
@ApiBearerAuth()
@Controller('admin/shops')
export class AdminShopController {
  constructor(private readonly shopService: ShopService) {}

  @Get()
  @Permissions(PERMISSIONS.SHOPS_READ)
  @ApiOperation({ summary: 'List all shops (paginated, filterable by status)' })
  @ApiResponse({ status: 200, type: [ShopResponseDto] })
  async findAll(@Query() query: ShopQueryDto) {
    return this.shopService.findAllShops(query);
  }

  @Get(':id')
  @Permissions(PERMISSIONS.SHOPS_READ)
  @ApiOperation({ summary: 'Get shop detail' })
  @ApiResponse({ status: 200, type: AdminShopResponseDto })
  @ApiResponse({ status: 404, description: 'SHOP_001: Shop not found' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.shopService.findShopById(id);
  }

  @Patch(':id/status')
  @Permissions(PERMISSIONS.SHOPS_UPDATE)
  @ApiOperation({ summary: 'Change shop status (active/suspended/banned)' })
  @ApiResponse({ status: 200, type: AdminShopResponseDto })
  @ApiResponse({ status: 404, description: 'SHOP_001: Shop not found' })
  async updateStatus(
    @CurrentUser() user: ICurrentUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateShopStatusDto,
  ) {
    return this.shopService.updateShopStatus(id, dto.status, user.id);
  }
}
