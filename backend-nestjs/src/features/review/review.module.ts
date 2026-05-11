import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReviewController } from './review.controller';
import { AdminReviewController } from './admin-review.controller';
import { ReviewService } from './review.service';
import { Review } from './entities/review.entity';
import { ReviewRepository } from './repositories/review.repository';
import { OrderModule } from '../order/order.module';
import { ProductModule } from '../product/product.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Review]),
    OrderModule,
    ProductModule,
  ],
  controllers: [ReviewController, AdminReviewController],
  providers: [
    ReviewService,
    ReviewRepository,
  ],
  exports: [ReviewService],
})
export class ReviewModule {}
