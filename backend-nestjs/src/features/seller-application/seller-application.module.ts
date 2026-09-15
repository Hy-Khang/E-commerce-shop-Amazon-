import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SellerApplication } from './entities/seller-application.entity';
import { SellerApplicationRepository } from './repositories/seller-application.repository';
import { SellerApplicationService } from './seller-application.service';
import { SellerApplicationController } from './seller-application.controller';
import { AdminSellerApplicationController } from './admin-seller-application.controller';
import { ShopModule } from '../shop/shop.module';

// AuthModule is global (provides AuthService) — no explicit import needed.
@Module({
  imports: [TypeOrmModule.forFeature([SellerApplication]), ShopModule],
  controllers: [
    SellerApplicationController,
    AdminSellerApplicationController,
  ],
  providers: [SellerApplicationService, SellerApplicationRepository],
  exports: [SellerApplicationService],
})
export class SellerApplicationModule {}
