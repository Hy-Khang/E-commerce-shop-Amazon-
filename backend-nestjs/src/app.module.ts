import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AppConfigModule } from './config/config.module';
import { DatabaseModule } from './core/database/database.module';
import { AuthModule } from './features/auth/auth.module';
import { UserProfileModule } from './features/user-profile/user-profile.module';
import { ProductModule } from './features/product/product.module';
import { CartModule } from './features/cart/cart.module';
import { OrderModule } from './features/order/order.module';
import { ReviewModule } from './features/review/review.module';
import { WishlistModule } from './features/wishlist/wishlist.module';
import { CouponModule } from './features/coupon/coupon.module';
import { UploadModule } from './features/upload/upload.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    AppConfigModule,
    DatabaseModule,
    EventEmitterModule.forRoot(),
    AuthModule,
    UserProfileModule,
    ProductModule,
    CartModule,
    OrderModule,
    ReviewModule,
    WishlistModule,
    CouponModule,
    UploadModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
