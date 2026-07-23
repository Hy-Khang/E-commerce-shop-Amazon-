import { PaymentTransaction } from '../entities/payment-transaction.entity';

export class PaymentTransactionResponseDto {
  id: number;
  order_id: number;
  transaction_ref: string;
  gateway: string;
  amount: number;
  status: string;
  gateway_transaction_id: string | null;
  created_at: Date;
  updated_at: Date;
}

export function toPaymentTransactionResponse(
  tx: PaymentTransaction,
): PaymentTransactionResponseDto {
  return {
    id: tx.id,
    order_id: tx.order_id,
    transaction_ref: tx.transaction_ref,
    gateway: tx.gateway,
    amount: Number(tx.amount),
    status: tx.status,
    gateway_transaction_id: tx.gateway_transaction_id,
    created_at: tx.created_at,
    updated_at: tx.updated_at,
  };
}
