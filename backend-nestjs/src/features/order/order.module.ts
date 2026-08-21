import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderController } from './order.controller';
import { AdminOrderController } from './admin-order.controller';
import { SellerOrderController } from './seller-order.controller';
import { ShipperOrderController } from './shipper-order.controller';
import { OrderService } from './order.service';
import { OrderScheduler } from './order.scheduler';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { OrderStatusHistory } from './entities/order-status-history.entity';
import { OrderTrackingLocation } from './entities/order-tracking-location.entity';
import { OrderPaymentListener } from './order-payment.listener';
import { OrderTrackingListener } from './order-tracking.listener';
import { OrderRepository } from './repositories/order.repository';
import { OrderItemRepository } from './repositories/order-item.repository';
import { OrderStatusHistoryRepository } from './repositories/order-status-history.repository';
import { OrderTrackingLocationRepository } from './repositories/order-tracking-location.repository';
import { CartModule } from '../cart/cart.module';
import { ProductModule } from '../product/product.module';
import { UserProfileModule } from '../user-profile/user-profile.module';
import { CouponModule } from '../coupon/coupon.module';
import { ShopModule } from '../shop/shop.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, OrderItem, OrderStatusHistory, OrderTrackingLocation]),
    CartModule,
    ProductModule,
    UserProfileModule,
    CouponModule,
    ShopModule,
  ],
  controllers: [OrderController, AdminOrderController, SellerOrderController, ShipperOrderController],
  providers: [
    OrderService,
    OrderScheduler,
    OrderPaymentListener,
    OrderTrackingListener,
    OrderRepository,
    OrderItemRepository,
    OrderStatusHistoryRepository,
    OrderTrackingLocationRepository,
  ],
  exports: [OrderService],
})
export class OrderModule {}
