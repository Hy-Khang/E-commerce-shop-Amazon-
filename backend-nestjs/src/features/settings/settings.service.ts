import { Injectable, Logger } from '@nestjs/common';
import { AppSettingRepository } from './repositories/app-setting.repository';
import { UpdateCoinSettingsDto } from './dto/update-coin-settings.dto';
import { CoinSettingsResponseDto } from './dto/coin-settings-response.dto';
import {
  COIN_SETTING_KEYS,
  CoinConfig,
  DEFAULT_COIN_CONFIG,
} from './types/settings.types';

@Injectable()
export class SettingsService {
  private readonly logger = new Logger(SettingsService.name);

  constructor(private readonly appSettingRepository: AppSettingRepository) {}

  /**
   * Resolve the coin config from `app_settings`, falling back to
   * DEFAULT_COIN_CONFIG for any missing/unparsable key. Read on every checkout
   * and completion — a light query (≤4 rows by unique key).
   */
  async getCoinConfig(): Promise<CoinConfig> {
    const keys = Object.values(COIN_SETTING_KEYS);
    const rows = await this.appSettingRepository.findByKeys(keys);
    const map = new Map(rows.map((r) => [r.key, r.value]));

    return {
      enabled: this.parseBool(
        map.get(COIN_SETTING_KEYS.ENABLED),
        DEFAULT_COIN_CONFIG.enabled,
      ),
      earn_rate_percent: this.parseNum(
        map.get(COIN_SETTING_KEYS.EARN_RATE_PERCENT),
        DEFAULT_COIN_CONFIG.earn_rate_percent,
      ),
      redeem_max_percent: this.parseNum(
        map.get(COIN_SETTING_KEYS.REDEEM_MAX_PERCENT),
        DEFAULT_COIN_CONFIG.redeem_max_percent,
      ),
      expiry_days: this.parseNum(
        map.get(COIN_SETTING_KEYS.EXPIRY_DAYS),
        DEFAULT_COIN_CONFIG.expiry_days,
      ),
    };
  }

  async getCoinConfigResponse(): Promise<CoinSettingsResponseDto> {
    return this.getCoinConfig();
  }

  async updateCoinConfig(
    dto: UpdateCoinSettingsDto,
    adminId: number,
  ): Promise<CoinSettingsResponseDto> {
    const writes: Array<[string, string]> = [];
    if (dto.enabled !== undefined)
      writes.push([COIN_SETTING_KEYS.ENABLED, String(dto.enabled)]);
    if (dto.earn_rate_percent !== undefined)
      writes.push([
        COIN_SETTING_KEYS.EARN_RATE_PERCENT,
        String(dto.earn_rate_percent),
      ]);
    if (dto.redeem_max_percent !== undefined)
      writes.push([
        COIN_SETTING_KEYS.REDEEM_MAX_PERCENT,
        String(dto.redeem_max_percent),
      ]);
    if (dto.expiry_days !== undefined)
      writes.push([COIN_SETTING_KEYS.EXPIRY_DAYS, String(dto.expiry_days)]);

    for (const [key, value] of writes) {
      await this.appSettingRepository.upsert(key, value, adminId);
    }

    this.logger.log(
      `Coin settings updated by admin ${adminId}: ${writes
        .map(([k, v]) => `${k}=${v}`)
        .join(', ')}`,
    );

    return this.getCoinConfig();
  }

  private parseBool(raw: string | undefined, fallback: boolean): boolean {
    if (raw == null) return fallback;
    return raw === 'true' || raw === '1';
  }

  private parseNum(raw: string | undefined, fallback: number): number {
    if (raw == null) return fallback;
    const n = Number(raw);
    return Number.isFinite(n) ? n : fallback;
  }
}
