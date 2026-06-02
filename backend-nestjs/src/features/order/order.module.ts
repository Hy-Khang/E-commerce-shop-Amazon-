import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderController } from './order.controller';
import { AdminOrderController } from './admin-order.controller';
import { OrderService } from './order.service';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { OrderRepository } from './repositories/order.repository';
import { OrderItemRepository } from './repositories/order-item.repository';
import { CartModule } from '../cart/cart.module';
import { ProductModule } from '../product/product.module';
import { UserProfileModule } from '../user-profile/user-profile.module';
import { CouponModule } from '../coupon/coupon.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, OrderItem]),
    CartModule,
    ProductModule,
    UserProfileModule,
    CouponModule,
  ],
  controllers: [OrderController, AdminOrderController],
  providers: [
    OrderService,
    OrderRepository,
    OrderItemRepository,
  ],
  exports: [OrderService],
})
export class OrderModule {}
