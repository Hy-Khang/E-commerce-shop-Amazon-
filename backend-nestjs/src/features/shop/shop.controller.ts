import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ShopService } from './shop.service';
import { ShopQueryDto } from './dto/shop-query.dto';
import {
  ShopResponseDto,
  ShopProfileResponseDto,
} from './dto/shop-response.dto';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Shops')
@Controller('shops')
export class ShopController {
  constructor(private readonly shopService: ShopService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'List active shops (paginated, searchable)' })
  @ApiResponse({ status: 200, type: [ShopResponseDto] })
  async findAll(@Query() query: ShopQueryDto) {
    return this.shopService.findActiveShops(query);
  }

  @Get(':slug')
  @Public()
  @ApiOperation({ summary: 'Get shop profile with stats' })
  @ApiResponse({ status: 200, type: ShopProfileResponseDto })
  @ApiResponse({ status: 404, description: 'SHOP_001: Shop not found' })
  async findBySlug(@Param('slug') slug: string) {
    return this.shopService.findShopBySlug(slug);
  }

  @Get(':slug/products')
  @Public()
  @ApiOperation({ summary: "List shop's products (paginated, filtered)" })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 404, description: 'SHOP_001: Shop not found' })
  async findShopProducts(
    @Param('slug') slug: string,
    @Query() query: ShopQueryDto,
  ) {
    return this.shopService.findShopProducts(slug, query);
  }
}
