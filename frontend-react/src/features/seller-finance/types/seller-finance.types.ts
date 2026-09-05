export interface WalletBalance {
  balance: number;
}

export type WalletTransactionType =
  | 'sale_earning'
  | 'withdrawal'
  | 'reversal'
  | 'withdrawal_refund';

export interface WalletTransaction {
  id: number;
  type: WalletTransactionType;
  amount: number;
  order_id: number | null;
  withdrawal_id: number | null;
  note: string | null;
  created_at: string;
}

export type WithdrawalStatus = 'pending' | 'approved' | 'rejected';

export interface Withdrawal {
  id: number;
  user_id: number;
  amount: number;
  status: WithdrawalStatus;
  bank_name: string;
  bank_account_number: string;
  bank_account_holder: string;
  reject_reason: string | null;
  reviewed_at: string | null;
  created_at: string;
}

export interface CreateWithdrawalRequest {
  amount: number;
  bank_name: string;
  bank_account_number: string;
  bank_account_holder: string;
}

export type CommissionMode = 'flat' | 'category';

export interface CommissionSettings {
  enabled: boolean;
  mode: CommissionMode;
  rate_percent: number;
}

export interface UpdateCommissionSettingsRequest {
  enabled?: boolean;
  mode?: CommissionMode;
  rate_percent?: number;
}

export interface CommissionCategoryRate {
  category_id: number;
  rate_percent: number;
}

export interface WithdrawalFilterParams {
  status?: WithdrawalStatus;
  page?: number;
  limit?: number;
}
