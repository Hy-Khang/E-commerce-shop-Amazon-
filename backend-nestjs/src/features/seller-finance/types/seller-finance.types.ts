/** Platform-commission ledger entry types. */
export enum CommissionTransactionType {
  Charge = 'charge',
  Reverse = 'reverse',
}

/** Seller-wallet ledger entry types. */
export enum WalletTransactionType {
  SaleEarning = 'sale_earning',
  Withdrawal = 'withdrawal',
  Reversal = 'reversal',
  WithdrawalRefund = 'withdrawal_refund',
}

/** Withdrawal (payout) request lifecycle. */
export enum WithdrawalStatus {
  Pending = 'pending',
  Approved = 'approved',
  Rejected = 'rejected',
}

/** One purchased line, reduced to what commission allocation needs. */
export interface CommissionOrderItem {
  /** price × quantity (pre-discount line subtotal), used as the allocation weight. */
  line_total: number;
  /** Snapshot of the product's category at checkout (null → platform rate). */
  category_id: number | null;
}

/**
 * Everything `CommissionService.chargeForOrder` needs, built by the order layer
 * so seller-finance never imports OrderModule/ProductModule (no circular dep).
 */
export interface OrderCommissionContext {
  order_id: number;
  shop_id: number;
  /** Owner of the wallet the net earning is credited to (shop.user_id). */
  seller_user_id: number;
  total_amount: number;
  shipping_fee: number;
  /** Purchased lines (used only in category mode; may be empty otherwise). */
  items: CommissionOrderItem[];
}
