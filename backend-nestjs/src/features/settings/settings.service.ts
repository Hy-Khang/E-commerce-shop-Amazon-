import { Injectable, Logger } from '@nestjs/common';
import { AppSettingRepository } from './repositories/app-setting.repository';
import { CommissionCategoryRateRepository } from './repositories/commission-category-rate.repository';
import { ProductService } from '../product/product.service';
import { Category } from '../product/entities/category.entity';
import { UpdateCoinSettingsDto } from './dto/update-coin-settings.dto';
import { CoinSettingsResponseDto } from './dto/coin-settings-response.dto';
import { UpdateCommissionSettingsDto } from './dto/update-commission-settings.dto';
import {
  CommissionCategoryRateDto,
  CommissionSettingsResponseDto,
} from './dto/commission-settings-response.dto';
import {
  COIN_SETTING_KEYS,
  COMMISSION_SETTING_KEYS,
  CoinConfig,
  CommissionConfig,
  CommissionMode,
  DEFAULT_COIN_CONFIG,
  DEFAULT_COMMISSION_CONFIG,
} from './types/settings.types';

@Injectable()
export class SettingsService {
  private readonly logger = new Logger(SettingsService.name);

  constructor(
    private readonly appSettingRepository: AppSettingRepository,
    private readonly commissionCategoryRateRepository: CommissionCategoryRateRepository,
    private readonly productService: ProductService,
  ) {}

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

  // ─── Commission config ───

  /**
   * Resolve the commission config from `app_settings`, falling back to
   * DEFAULT_COMMISSION_CONFIG for any missing/unparsable key. Read at every
   * order completion.
   */
  async getCommissionConfig(): Promise<CommissionConfig> {
    const keys = Object.values(COMMISSION_SETTING_KEYS);
    const rows = await this.appSettingRepository.findByKeys(keys);
    const map = new Map(rows.map((r) => [r.key, r.value]));

    const rawMode = map.get(COMMISSION_SETTING_KEYS.MODE);
    const mode =
      rawMode === CommissionMode.Category
        ? CommissionMode.Category
        : CommissionMode.Flat;

    return {
      enabled: this.parseBool(
        map.get(COMMISSION_SETTING_KEYS.ENABLED),
        DEFAULT_COMMISSION_CONFIG.enabled,
      ),
      mode,
      rate_percent: this.parseNum(
        map.get(COMMISSION_SETTING_KEYS.RATE_PERCENT),
        DEFAULT_COMMISSION_CONFIG.rate_percent,
      ),
    };
  }

  async getCommissionConfigResponse(): Promise<CommissionSettingsResponseDto> {
    return this.getCommissionConfig();
  }

  async updateCommissionConfig(
    dto: UpdateCommissionSettingsDto,
    adminId: number,
  ): Promise<CommissionSettingsResponseDto> {
    const writes: Array<[string, string]> = [];
    if (dto.enabled !== undefined)
      writes.push([COMMISSION_SETTING_KEYS.ENABLED, String(dto.enabled)]);
    if (dto.mode !== undefined)
      writes.push([COMMISSION_SETTING_KEYS.MODE, dto.mode]);
    if (dto.rate_percent !== undefined)
      writes.push([
        COMMISSION_SETTING_KEYS.RATE_PERCENT,
        String(dto.rate_percent),
      ]);

    for (const [key, value] of writes) {
      await this.appSettingRepository.upsert(key, value, adminId);
    }

    this.logger.log(
      `Commission settings updated by admin ${adminId}: ${writes
        .map(([k, v]) => `${k}=${v}`)
        .join(', ')}`,
    );

    return this.getCommissionConfig();
  }

  /**
   * Effective per-category commission rates as a `{ category_id → rate_percent }`
   * map, used by the category-mode engine (exact match on the order line's
   * snapshot `category_id`).
   *
   * A rate override **cascades down the category tree**: a category with no
   * override of its own inherits the rate of its nearest ancestor that has one
   * (a child's own override wins over the inherited one). Categories with no
   * ancestor override are omitted → the engine falls back to the platform
   * `rate_percent`. This matches how coupon `scope='categories'` covers
   * sub-categories, and matches the admin's intuition that "set Điện tử = 5%"
   * covers everything under Điện tử — products are typically assigned to a leaf
   * category, so an ancestor-only override would otherwise never fire.
   *
   * The raw (un-cascaded) overrides remain visible for editing via
   * `listCommissionCategoryRates`.
   */
  async getCommissionCategoryRateMap(): Promise<Map<number, number>> {
    const rows = await this.commissionCategoryRateRepository.findAll();
    const overrides = new Map(
      rows.map((r) => [r.category_id, Number(r.rate_percent)]),
    );
    if (overrides.size === 0) return new Map();

    const tree = await this.productService.getCategoryTree();
    const effective = new Map<number, number>();

    const walk = (nodes: Category[], inherited: number | undefined): void => {
      for (const node of nodes) {
        const rate = overrides.has(node.id)
          ? overrides.get(node.id)!
          : inherited;
        if (rate !== undefined) effective.set(node.id, rate);
        if (node.children?.length) walk(node.children, rate);
      }
    };
    walk(tree, undefined);

    return effective;
  }

  async listCommissionCategoryRates(): Promise<CommissionCategoryRateDto[]> {
    const rows = await this.commissionCategoryRateRepository.findAll();
    return rows.map((r) => ({
      category_id: r.category_id,
      rate_percent: Number(r.rate_percent),
    }));
  }

  async upsertCommissionCategoryRate(
    categoryId: number,
    ratePercent: number,
    adminId: number,
  ): Promise<CommissionCategoryRateDto> {
    await this.commissionCategoryRateRepository.upsert(
      categoryId,
      ratePercent,
      adminId,
    );
    return { category_id: categoryId, rate_percent: ratePercent };
  }

  async deleteCommissionCategoryRate(categoryId: number): Promise<void> {
    await this.commissionCategoryRateRepository.delete(categoryId);
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
