import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Shop } from './entities/shop.entity';
import { ShopRepository } from './repositories/shop.repository';
import { ShopService } from './shop.service';
import { ShopController } from './shop.controller';
import { SellerShopController } from './seller-shop.controller';
import { AdminShopController } from './admin-shop.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Shop])],
  controllers: [ShopController, SellerShopController, AdminShopController],
  providers: [ShopService, ShopRepository],
  exports: [ShopService],
})
export class ShopModule {}
