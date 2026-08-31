import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppSetting } from './entities/app-setting.entity';
import { AppSettingRepository } from './repositories/app-setting.repository';
import { SettingsService } from './settings.service';
import { AdminSettingsController } from './admin-settings.controller';

@Module({
  imports: [TypeOrmModule.forFeature([AppSetting])],
  controllers: [AdminSettingsController],
  providers: [SettingsService, AppSettingRepository],
  exports: [SettingsService],
})
export class SettingsModule {}
