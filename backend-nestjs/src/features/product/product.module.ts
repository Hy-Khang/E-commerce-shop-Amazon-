import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductController } from './product.controller';
import { AdminProductController } from './admin-product.controller';
import { AdminCategoryController } from './admin-category.controller';
import { SellerProductController } from './seller-product.controller';
import { ProductService } from './product.service';
import { Category } from './entities/category.entity';
import { Product } from './entities/product.entity';
import { ProductVariant } from './entities/product-variant.entity';
import { ProductImage } from './entities/product-image.entity';
import { CategoryRepository } from './repositories/category.repository';
import { ProductRepository } from './repositories/product.repository';
import { ProductVariantRepository } from './repositories/product-variant.repository';
import { ProductImageRepository } from './repositories/product-image.repository';
import { ShopModule } from '../shop/shop.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Category, Product, ProductVariant, ProductImage]),
    ShopModule,
  ],
  controllers: [
    ProductController,
    AdminProductController,
    AdminCategoryController,
    SellerProductController,
  ],
  providers: [
    ProductService,
    CategoryRepository,
    ProductRepository,
    ProductVariantRepository,
    ProductImageRepository,
  ],
  exports: [ProductService],
})
export class ProductModule {}
