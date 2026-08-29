import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FlashSaleController } from './flash-sale.controller';
import { AdminFlashSaleController } from './admin-flash-sale.controller';
import { SellerFlashSaleController } from './seller-flash-sale.controller';
import { FlashSaleService } from './flash-sale.service';
import { FlashSaleScheduler } from './flash-sale.scheduler';
import { FlashSale } from './entities/flash-sale.entity';
import { FlashSaleItem } from './entities/flash-sale-item.entity';
import { FlashSaleRepository } from './repositories/flash-sale.repository';
import { FlashSaleItemRepository } from './repositories/flash-sale-item.repository';
import { ProductModule } from '../product/product.module';
import { ShopModule } from '../shop/shop.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([FlashSale, FlashSaleItem]),
    // Validate variants + ownership when sellers register (ProductService.findVariantById).
    // Acyclic: neither ProductModule nor ShopModule imports FlashSaleModule.
    ProductModule,
    // Resolve the seller's shop + active check (ShopService.resolveShopByUserId).
    ShopModule,
  ],
  controllers: [
    FlashSaleController,
    AdminFlashSaleController,
    SellerFlashSaleController,
  ],
  providers: [
    FlashSaleService,
    FlashSaleScheduler,
    FlashSaleRepository,
    FlashSaleItemRepository,
  ],
  exports: [FlashSaleService],
})
export class FlashSaleModule {}
