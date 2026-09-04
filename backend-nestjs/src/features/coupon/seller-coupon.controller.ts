import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CouponService } from './coupon.service';
import { CreateSellerCouponDto } from './dto/create-seller-coupon.dto';
import { UpdateSellerCouponDto } from './dto/update-seller-coupon.dto';
import { CouponQueryDto } from './dto/coupon-query.dto';
import { CouponResponseDto } from './dto/coupon-response.dto';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PERMISSIONS } from '../../common/constants/permissions.constant';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { ICurrentUser } from '../../common/interfaces/current-user.interface';
import { PaginationDto } from '../../common/dto/pagination.dto';

@ApiTags('Seller: Coupons')
@ApiBearerAuth()
@Controller('seller/coupons')
export class SellerCouponController {
  constructor(private readonly couponService: CouponService) {}

  @Get()
  @Permissions(PERMISSIONS.COUPONS_READ)
  @ApiOperation({
    summary: "List the current seller's shop coupons (paginated)",
  })
  async findAll(
    @CurrentUser() user: ICurrentUser,
    @Query() query: CouponQueryDto,
  ) {
    return this.couponService.findSellerCoupons(user.id, query);
  }

  @Get(':id')
  @Permissions(PERMISSIONS.COUPONS_READ)
  @ApiOperation({ summary: 'Get shop coupon detail (own shop only)' })
  @ApiResponse({ status: 200, type: CouponResponseDto })
  @ApiResponse({
    status: 403,
    description: 'COUPON_010: Coupon not owned by your shop',
  })
  async findOne(
    @CurrentUser() user: ICurrentUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.couponService.findSellerCouponById(user.id, id);
  }

  @Post()
  @Permissions(PERMISSIONS.COUPONS_CREATE)
  @ApiOperation({
    summary: 'Create shop coupon (code auto-prefixed with shop slug)',
  })
  @ApiResponse({ status: 201, type: CouponResponseDto })
  @ApiResponse({
    status: 400,
    description: 'COUPON_009: Product not in your shop',
  })
  @ApiResponse({
    status: 409,
    description: 'COUPON_007: Coupon code already exists',
  })
  async create(
    @CurrentUser() user: ICurrentUser,
    @Body() dto: CreateSellerCouponDto,
  ) {
    return this.couponService.createSellerCoupon(user.id, dto);
  }

  @Patch(':id')
  @Permissions(PERMISSIONS.COUPONS_UPDATE)
  @ApiOperation({
    summary: 'Update shop coupon (code immutable, own shop only)',
  })
  @ApiResponse({ status: 200, type: CouponResponseDto })
  @ApiResponse({
    status: 403,
    description: 'COUPON_010: Coupon not owned by your shop',
  })
  async update(
    @CurrentUser() user: ICurrentUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSellerCouponDto,
  ) {
    return this.couponService.updateSellerCoupon(user.id, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Permissions(PERMISSIONS.COUPONS_DELETE)
  @ApiOperation({
    summary: 'Deactivate shop coupon (soft delete, own shop only)',
  })
  async remove(
    @CurrentUser() user: ICurrentUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.couponService.deactivateSellerCoupon(user.id, id);
  }

  @Get(':id/usages')
  @Permissions(PERMISSIONS.COUPONS_READ)
  @ApiOperation({ summary: 'List usages for a shop coupon (own shop only)' })
  async findUsages(
    @CurrentUser() user: ICurrentUser,
    @Param('id', ParseIntPipe) id: number,
    @Query() query: PaginationDto,
  ) {
    return this.couponService.findSellerCouponUsages(
      user.id,
      id,
      query.page,
      query.limit,
    );
  }
}
