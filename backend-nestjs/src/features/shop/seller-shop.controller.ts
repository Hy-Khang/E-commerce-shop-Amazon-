import { Body, Controller, Get, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ShopService } from './shop.service';
import { CreateShopDto } from './dto/create-shop.dto';
import { UpdateShopDto } from './dto/update-shop.dto';
import { ShopResponseDto } from './dto/shop-response.dto';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PERMISSIONS } from '../../common/constants/permissions.constant';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { ICurrentUser } from '../../common/interfaces/current-user.interface';

@ApiTags('Seller: Shop')
@ApiBearerAuth()
@Controller('seller')
export class SellerShopController {
  constructor(private readonly shopService: ShopService) {}

  @Get('shop')
  @Permissions(PERMISSIONS.SHOPS_READ)
  @ApiOperation({ summary: 'Get my shop' })
  @ApiResponse({ status: 200, type: ShopResponseDto })
  @ApiResponse({ status: 400, description: 'SHOP_004: Shop not set up' })
  async getMyShop(@CurrentUser() user: ICurrentUser) {
    return this.shopService.getMyShop(user.id);
  }

  @Post('shop')
  @Permissions(PERMISSIONS.SHOPS_CREATE)
  @ApiOperation({ summary: 'Create my shop' })
  @ApiResponse({ status: 201, type: ShopResponseDto })
  @ApiResponse({ status: 409, description: 'SHOP_002: Shop already exists' })
  async createShop(@CurrentUser() user: ICurrentUser, @Body() dto: CreateShopDto) {
    return this.shopService.createShop(user.id, dto);
  }

  @Patch('shop')
  @Permissions(PERMISSIONS.SHOPS_UPDATE)
  @ApiOperation({ summary: 'Update my shop (name, description, logo, banner)' })
  @ApiResponse({ status: 200, type: ShopResponseDto })
  @ApiResponse({ status: 400, description: 'SHOP_004: Shop not set up' })
  async updateShop(@CurrentUser() user: ICurrentUser, @Body() dto: UpdateShopDto) {
    return this.shopService.updateMyShop(user.id, dto);
  }
}
