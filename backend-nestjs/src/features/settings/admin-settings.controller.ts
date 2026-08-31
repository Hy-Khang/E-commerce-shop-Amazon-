import { Body, Controller, Get, Patch } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { SettingsService } from './settings.service';
import { UpdateCoinSettingsDto } from './dto/update-coin-settings.dto';
import { CoinSettingsResponseDto } from './dto/coin-settings-response.dto';
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
}
