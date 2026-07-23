export type TransactionStatus = 'pending' | 'completed' | 'failed' | 'refunded';
export type PaymentGateway = 'vnpay' | 'momo';

export interface PaymentTransaction {
  id: number;
  order_id: number;
  transaction_ref: string;
  gateway: PaymentGateway;
  amount: number;
  status: TransactionStatus;
  gateway_transaction_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreatePaymentRequest {
  order_id: number;
}

export interface CreatePaymentResponse {
  payment_url: string;
  transaction_ref: string;
}
