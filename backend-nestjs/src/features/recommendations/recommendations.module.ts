import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RecommendationsController } from './recommendations.controller';
import { RecommendationsService } from './recommendations.service';
import { ActivityService } from './activity.service';
import { RecommendationsListener } from './recommendations.listener';
import { RecommendationsScheduler } from './recommendations.scheduler';
import { UserActivityLog } from './entities/user-activity-log.entity';
import { UserActivityLogRepository } from './repositories/user-activity-log.repository';
import { ProductModule } from '../product/product.module';

@Module({
  imports: [TypeOrmModule.forFeature([UserActivityLog]), ProductModule],
  controllers: [RecommendationsController],
  providers: [
    RecommendationsService,
    ActivityService,
    UserActivityLogRepository,
    RecommendationsListener,
    RecommendationsScheduler,
  ],
  exports: [RecommendationsService],
})
export class RecommendationsModule {}
