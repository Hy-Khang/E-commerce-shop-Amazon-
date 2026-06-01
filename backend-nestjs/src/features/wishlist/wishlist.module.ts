import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WishlistController } from './wishlist.controller';
import { AdminWishlistController } from './admin-wishlist.controller';
import { WishlistService } from './wishlist.service';
import { WishlistItem } from './entities/wishlist-item.entity';
import { WishlistItemRepository } from './repositories/wishlist-item.repository';
import { ProductModule } from '../product/product.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([WishlistItem]),
    ProductModule,
  ],
  controllers: [WishlistController, AdminWishlistController],
  providers: [
    WishlistService,
    WishlistItemRepository,
  ],
  exports: [WishlistService],
})
export class WishlistModule {}
