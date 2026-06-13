import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from '../order/entities/order.entity';
import { HomepageController } from './homepage.controller';
import { HomepageService } from './homepage.service';
import { HomepageRepository } from './repositories/homepage.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Order])],
  controllers: [HomepageController],
  providers: [HomepageService, HomepageRepository],
})
export class HomepageModule {}
