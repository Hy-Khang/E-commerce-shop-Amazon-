import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CouponController } from './coupon.controller';
import { AdminCouponController } from './admin-coupon.controller';
import { CouponService } from './coupon.service';
import { Coupon } from './entities/coupon.entity';
import { CouponCategory } from './entities/coupon-category.entity';
import { CouponProduct } from './entities/coupon-product.entity';
import { CouponUsage } from './entities/coupon-usage.entity';
import { CouponRepository } from './repositories/coupon.repository';
import { CouponUsageRepository } from './repositories/coupon-usage.repository';
import { Category } from '../product/entities/category.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Coupon,
      CouponCategory,
      CouponProduct,
      CouponUsage,
      Category,
    ]),
  ],
  controllers: [CouponController, AdminCouponController],
  providers: [CouponService, CouponRepository, CouponUsageRepository],
  exports: [CouponService],
})
export class CouponModule {}
