/** Lifecycle of an earned Xu batch (source-of-truth for balance + FIFO). */
export enum CoinBatchStatus {
  Active = 'active',
  Depleted = 'depleted',
  Expired = 'expired',
  Reversed = 'reversed',
}

/** Immutable ledger entry types (sign is derived from the type, not stored). */
export enum CoinTransactionType {
  Earn = 'earn',
  Redeem = 'redeem',
  Expire = 'expire',
  ReverseEarn = 'reverse_earn',
  Refund = 'refund',
}

/** Result of consuming Xu for a checkout (how much was actually spent). */
export interface ICoinRedemptionResult {
  /** Total Xu consumed across the FIFO batches. */
  spent: number;
}

/** Per-shop allocation of a checkout's redeemed Xu. */
export interface ICoinAllocation {
  /** shopId → Xu applied to that shop's sub-order. */
  byShop: Map<number, number>;
  /** Σ byShop — the actual amount to consume (≤ requested). */
  total: number;
}
