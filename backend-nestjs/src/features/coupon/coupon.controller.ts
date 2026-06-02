import {
  Body,
  Controller,
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
import { CouponService } from './coupon.service';
import { ValidateCouponDto } from './dto/validate-coupon.dto';
import { CouponValidationResponseDto } from './dto/coupon-response.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Coupon')
@ApiBearerAuth()
@Controller('coupons')
export class CouponController {
  constructor(private readonly couponService: CouponService) {}

  @Post('validate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Validate coupon code and return discount info' })
  @ApiResponse({ status: 200, type: CouponValidationResponseDto })
  async validate(
    @CurrentUser() user: { id: number },
    @Body() dto: ValidateCouponDto,
  ): Promise<CouponValidationResponseDto> {
    return this.couponService.validateCouponForUser(user.id, dto.code);
  }
}
