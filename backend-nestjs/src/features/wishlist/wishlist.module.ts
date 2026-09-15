import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WishlistController } from './wishlist.controller';
import { AdminWishlistController } from './admin-wishlist.controller';
import { SellerWishlistController } from './seller-wishlist.controller';
import { WishlistService } from './wishlist.service';
import { WishlistItem } from './entities/wishlist-item.entity';
import { WishlistItemRepository } from './repositories/wishlist-item.repository';
import { ProductModule } from '../product/product.module';
import { ShopModule } from '../shop/shop.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([WishlistItem]),
    ProductModule,
    ShopModule,
  ],
  controllers: [
    WishlistController,
    AdminWishlistController,
    SellerWishlistController,
  ],
  providers: [WishlistService, WishlistItemRepository],
  exports: [WishlistService],
})
export class WishlistModule {}
