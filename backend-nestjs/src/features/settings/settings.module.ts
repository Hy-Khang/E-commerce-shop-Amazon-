import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppSetting } from './entities/app-setting.entity';
import { CommissionCategoryRate } from './entities/commission-category-rate.entity';
import { AppSettingRepository } from './repositories/app-setting.repository';
import { CommissionCategoryRateRepository } from './repositories/commission-category-rate.repository';
import { SettingsService } from './settings.service';
import { AdminSettingsController } from './admin-settings.controller';
import { ProductModule } from '../product/product.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([AppSetting, CommissionCategoryRate]),
    // For category-mode commission: resolve the category tree so a parent's
    // rate override cascades down to its descendant categories (see
    // getCommissionCategoryRateMap). Product doesn't import Settings → no cycle.
    ProductModule,
  ],
  controllers: [AdminSettingsController],
  providers: [
    SettingsService,
    AppSettingRepository,
    CommissionCategoryRateRepository,
  ],
  exports: [SettingsService],
})
export class SettingsModule {}
