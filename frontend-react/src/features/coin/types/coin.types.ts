export type CoinTransactionType =
  | 'earn'
  | 'redeem'
  | 'expire'
  | 'reverse_earn'
  | 'refund';

export interface ExpiringCoinBatch {
  amount: number;
  expires_at: string;
}

export interface CoinBalance {
  balance: number;
  expiring_soon: ExpiringCoinBatch[];
}

export interface CoinTransaction {
  id: number;
  type: CoinTransactionType;
  amount: number;
  order_id: number | null;
  note: string | null;
  created_at: string;
}

export interface CoinSettings {
  enabled: boolean;
  earn_rate_percent: number;
  redeem_max_percent: number;
  expiry_days: number;
}

export interface UpdateCoinSettingsRequest {
  enabled?: boolean;
  earn_rate_percent?: number;
  redeem_max_percent?: number;
  expiry_days?: number;
}
