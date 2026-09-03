import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from '../order/entities/order.entity';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { SellerDashboardController } from './seller-dashboard.controller';
import { SellerDashboardService } from './seller-dashboard.service';
import { ShipperDashboardController } from './shipper-dashboard.controller';
import { ShipperDashboardService } from './shipper-dashboard.service';
import { DashboardRepository } from './repositories/dashboard.repository';
import { ShopModule } from '../shop/shop.module';

@Module({
  imports: [TypeOrmModule.forFeature([Order]), ShopModule],
  controllers: [
    DashboardController,
    SellerDashboardController,
    ShipperDashboardController,
  ],
  providers: [
    DashboardService,
    SellerDashboardService,
    ShipperDashboardService,
    DashboardRepository,
  ],
})
export class DashboardModule {}
