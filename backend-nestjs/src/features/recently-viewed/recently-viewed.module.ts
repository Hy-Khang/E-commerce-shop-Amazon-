import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RecentlyViewedController } from './recently-viewed.controller';
import { RecentlyViewedService } from './recently-viewed.service';
import { RecentlyViewed } from './entities/recently-viewed.entity';
import { RecentlyViewedRepository } from './repositories/recently-viewed.repository';
import { ProductModule } from '../product/product.module';

@Module({
  imports: [TypeOrmModule.forFeature([RecentlyViewed]), ProductModule],
  controllers: [RecentlyViewedController],
  providers: [RecentlyViewedService, RecentlyViewedRepository],
  exports: [RecentlyViewedService],
})
export class RecentlyViewedModule {}
