import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Patch,
  Put,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { SettingsService } from './settings.service';
import { UpdateCoinSettingsDto } from './dto/update-coin-settings.dto';
import { CoinSettingsResponseDto } from './dto/coin-settings-response.dto';
import { UpdateCommissionSettingsDto } from './dto/update-commission-settings.dto';
import {
  CommissionCategoryRateDto,
  CommissionSettingsResponseDto,
} from './dto/commission-settings-response.dto';
import { UpsertCommissionCategoryRateDto } from './dto/upsert-commission-category-rate.dto';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PERMISSIONS } from '../../common/constants/permissions.constant';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { ICurrentUser } from '../../common/interfaces/current-user.interface';

@ApiTags('Admin — Settings')
@ApiBearerAuth()
@Controller('admin/settings')
export class AdminSettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get('coins')
  @Permissions(PERMISSIONS.SETTINGS_READ)
  @ApiOperation({ summary: 'Get coin (Hoàn Xu) feature configuration' })
  @ApiResponse({ status: 200, type: CoinSettingsResponseDto })
  async getCoinSettings(): Promise<CoinSettingsResponseDto> {
    return this.settingsService.getCoinConfigResponse();
  }

  @Patch('coins')
  @Permissions(PERMISSIONS.SETTINGS_UPDATE)
  @ApiOperation({
    summary: 'Update coin config (earn rate / redeem cap / expiry / enabled)',
  })
  @ApiResponse({ status: 200, type: CoinSettingsResponseDto })
  async updateCoinSettings(
    @CurrentUser() user: ICurrentUser,
    @Body() dto: UpdateCoinSettingsDto,
  ): Promise<CoinSettingsResponseDto> {
    return this.settingsService.updateCoinConfig(dto, user.id);
  }

  // ─── Commission (platform chiết khấu) ───

  @Get('commission')
  @Permissions(PERMISSIONS.SETTINGS_READ)
  @ApiOperation({ summary: 'Get platform commission configuration' })
  @ApiResponse({ status: 200, type: CommissionSettingsResponseDto })
  async getCommissionSettings(): Promise<CommissionSettingsResponseDto> {
    return this.settingsService.getCommissionConfigResponse();
  }

  @Patch('commission')
  @Permissions(PERMISSIONS.SETTINGS_UPDATE)
  @ApiOperation({ summary: 'Update commission config (enabled/mode/rate)' })
  @ApiResponse({ status: 200, type: CommissionSettingsResponseDto })
  async updateCommissionSettings(
    @CurrentUser() user: ICurrentUser,
    @Body() dto: UpdateCommissionSettingsDto,
  ): Promise<CommissionSettingsResponseDto> {
    return this.settingsService.updateCommissionConfig(dto, user.id);
  }

  @Get('commission/category-rates')
  @Permissions(PERMISSIONS.SETTINGS_READ)
  @ApiOperation({ summary: 'List per-category commission rate overrides' })
  @ApiResponse({ status: 200, type: [CommissionCategoryRateDto] })
  async listCommissionCategoryRates(): Promise<CommissionCategoryRateDto[]> {
    return this.settingsService.listCommissionCategoryRates();
  }

  @Put('commission/category-rates/:categoryId')
  @Permissions(PERMISSIONS.SETTINGS_UPDATE)
  @ApiOperation({ summary: 'Set a category commission rate override' })
  @ApiResponse({ status: 200, type: CommissionCategoryRateDto })
  async upsertCommissionCategoryRate(
    @CurrentUser() user: ICurrentUser,
    @Param('categoryId', ParseIntPipe) categoryId: number,
    @Body() dto: UpsertCommissionCategoryRateDto,
  ): Promise<CommissionCategoryRateDto> {
    return this.settingsService.upsertCommissionCategoryRate(
      categoryId,
      dto.rate_percent,
      user.id,
    );
  }

  @Delete('commission/category-rates/:categoryId')
  @Permissions(PERMISSIONS.SETTINGS_UPDATE)
  @HttpCode(204)
  @ApiOperation({ summary: 'Remove a category commission rate override' })
  @ApiResponse({ status: 204 })
  async deleteCommissionCategoryRate(
    @Param('categoryId', ParseIntPipe) categoryId: number,
  ): Promise<void> {
    await this.settingsService.deleteCommissionCategoryRate(categoryId);
  }
}
