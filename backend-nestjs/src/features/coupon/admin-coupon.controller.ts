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
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';
import { CouponQueryDto, CouponUsageQueryDto } from './dto/coupon-query.dto';
import { CouponResponseDto } from './dto/coupon-response.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { PaginationDto } from '../../common/dto/pagination.dto';

@ApiTags('Admin: Coupons')
@ApiBearerAuth()
@Roles('admin')
@Controller('admin/coupons')
export class AdminCouponController {
  constructor(private readonly couponService: CouponService) {}

  @Get()
  @ApiOperation({ summary: 'List all coupons (paginated)' })
  async findAll(@Query() query: CouponQueryDto) {
    return this.couponService.findAllCoupons(query);
  }

  @Get('usages')
  @ApiOperation({ summary: 'List all coupon usages' })
  async findAllUsages(@Query() query: CouponUsageQueryDto) {
    return this.couponService.findAllUsages(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get coupon detail' })
  @ApiResponse({ status: 200, type: CouponResponseDto })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.couponService.findCouponById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create coupon' })
  @ApiResponse({ status: 201, type: CouponResponseDto })
  async create(@Body() dto: CreateCouponDto) {
    return this.couponService.createCoupon(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update coupon' })
  @ApiResponse({ status: 200, type: CouponResponseDto })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCouponDto,
  ) {
    return this.couponService.updateCoupon(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Deactivate coupon (soft delete)' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.couponService.deactivateCoupon(id);
  }

  @Get(':id/usages')
  @ApiOperation({ summary: 'List usages for a specific coupon' })
  async findUsagesByCoupon(
    @Param('id', ParseIntPipe) id: number,
    @Query() query: PaginationDto,
  ) {
    return this.couponService.findCouponUsages(
      id,
      query.page,
      query.limit,
    );
  }
}
