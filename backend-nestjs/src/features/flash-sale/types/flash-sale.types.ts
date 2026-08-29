export enum FlashSaleStatus {
  Scheduled = 'scheduled',
  Active = 'active',
  Ended = 'ended',
}

/** Lifecycle of a single seller registration (a flash_sale_items row). */
export enum FlashSaleItemStatus {
  Pending = 'pending',
  Approved = 'approved',
  Rejected = 'rejected',
}

export enum FlashSaleSortBy {
  CreatedAt = 'created_at',
  StartsAt = 'starts_at',
  EndsAt = 'ends_at',
  Name = 'name',
}

/**
 * The active flash price for a variant right now, plus how many units remain.
 * Produced by FlashSaleService.getActiveFlashPriceMap() and consumed by order
 * checkout/preview and the coupon service so every path agrees on the price.
 */
export interface IActiveFlashPrice {
  flashItemId: number;
  flashPrice: number;
  remaining: number;
}
