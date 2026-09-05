import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule } from '@nestjs/throttler';
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
import { CoinModule } from './features/coin/coin.module';
import { SettingsModule } from './features/settings/settings.module';
import { UploadModule } from './features/upload/upload.module';
import { DashboardModule } from './features/dashboard/dashboard.module';
import { ShopModule } from './features/shop/shop.module';
import { NotificationModule } from './features/notification/notification.module';
import { PaymentModule } from './features/payment/payment.module';
import { HomepageModule } from './features/homepage/homepage.module';
import { FlashSaleModule } from './features/flash-sale/flash-sale.module';
import { RecentlyViewedModule } from './features/recently-viewed/recently-viewed.module';
import { ChatModule } from './features/chat/chat.module';
import { AiChatModule } from './features/ai-chat/ai-chat.module';
import { SellerApplicationModule } from './features/seller-application/seller-application.module';
import { SellerFinanceModule } from './features/seller-finance/seller-finance.module';
import { MailModule } from './core/mail/mail.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    AppConfigModule,
    DatabaseModule,
    EventEmitterModule.forRoot(),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 10 }]),
    AuthModule.forRoot(),
    UserProfileModule,
    ProductModule,
    CartModule,
    OrderModule,
    ReviewModule,
    WishlistModule,
    CouponModule,
    CoinModule,
    SettingsModule,
    UploadModule,
    DashboardModule,
    ShopModule,
    NotificationModule,
    PaymentModule,
    HomepageModule,
    FlashSaleModule,
    RecentlyViewedModule,
    ChatModule,
    AiChatModule,
    SellerApplicationModule,
    SellerFinanceModule,
    MailModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
