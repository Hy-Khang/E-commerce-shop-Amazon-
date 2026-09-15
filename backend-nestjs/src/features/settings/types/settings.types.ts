/**
 * Coin (Hoàn Xu) runtime configuration, resolved from `app_settings` rows.
 * All persisted as strings; the service casts to these concrete types.
 */
export interface CoinConfig {
  /** Master on/off switch — when false, no earning and no redemption. */
  enabled: boolean;
  /** % of the (post-discount, ex-shipping) items total awarded as Xu on completion. */
  earn_rate_percent: number;
  /** Max % of a checkout's items total (after coupons) redeemable in Xu. */
  redeem_max_percent: number;
  /** Days until an earned Xu batch expires. */
  expiry_days: number;
}

/** `app_settings.key` values backing the coin config. */
export const COIN_SETTING_KEYS = {
  ENABLED: 'coin.enabled',
  EARN_RATE_PERCENT: 'coin.earn_rate_percent',
  REDEEM_MAX_PERCENT: 'coin.redeem_max_percent',
  EXPIRY_DAYS: 'coin.expiry_days',
} as const;

/** Fallback config if a key is missing from the DB (matches the seeded values). */
export const DEFAULT_COIN_CONFIG: CoinConfig = {
  enabled: true,
  earn_rate_percent: 1,
  redeem_max_percent: 50,
  expiry_days: 90,
};

/** How the platform commission rate is resolved. */
export enum CommissionMode {
  /** A single platform-wide rate. */
  Flat = 'flat',
  /** Per-category rates (with the flat rate as the fallback). */
  Category = 'category',
}

/**
 * Platform-commission runtime config, resolved from `app_settings`.
 */
export interface CommissionConfig {
  /** Master on/off — when false, no commission is charged and no net is credited. */
  enabled: boolean;
  /** `flat` (one rate) or `category` (per-category overrides + flat fallback). */
  mode: CommissionMode;
  /** Platform-wide rate percent (0–100); the fallback in category mode too. */
  rate_percent: number;
}

/** `app_settings.key` values backing the commission config. */
export const COMMISSION_SETTING_KEYS = {
  ENABLED: 'commission.enabled',
  MODE: 'commission.mode',
  RATE_PERCENT: 'commission.rate_percent',
} as const;

/** Fallback commission config if a key is missing (matches the seeded values). */
export const DEFAULT_COMMISSION_CONFIG: CommissionConfig = {
  enabled: true,
  mode: CommissionMode.Flat,
  rate_percent: 10,
};
