import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CouponController } from './coupon.controller';
import { AdminCouponController } from './admin-coupon.controller';
import { SellerCouponController } from './seller-coupon.controller';
import { CouponService } from './coupon.service';
import { Coupon } from './entities/coupon.entity';
import { CouponCategory } from './entities/coupon-category.entity';
import { CouponProduct } from './entities/coupon-product.entity';
import { CouponUsage } from './entities/coupon-usage.entity';
import { CouponRepository } from './repositories/coupon.repository';
import { CouponUsageRepository } from './repositories/coupon-usage.repository';
import { Category } from '../product/entities/category.entity';
import { Product } from '../product/entities/product.entity';
import { ShopModule } from '../shop/shop.module';
import { CartModule } from '../cart/cart.module';
import { FlashSaleModule } from '../flash-sale/flash-sale.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Coupon,
      CouponCategory,
      CouponProduct,
      CouponUsage,
      Category,
      Product,
    ]),
    ShopModule,
    // Read the caller's cart to build the availability catalog. Acyclic:
    // CartModule imports only ProductModule, never CouponModule.
    CartModule,
    // Price cart items at their active flash price so coupon math matches
    // checkout. Acyclic: FlashSaleModule imports only ProductModule.
    FlashSaleModule,
  ],
  controllers: [
    CouponController,
    AdminCouponController,
    SellerCouponController,
  ],
  providers: [CouponService, CouponRepository, CouponUsageRepository],
  exports: [CouponService],
})
export class CouponModule {}
