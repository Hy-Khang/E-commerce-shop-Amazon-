# Payment Feature

## Purpose
Integrates VNPay and MoMo payment gateways for online checkout. Handles payment URL creation, IPN (Instant Payment Notification) callbacks, signature verification, and automatic timeout of pending transactions.

## Entities
- `payment_transactions` — tracks each payment attempt (one order can have multiple transactions if retries occur)

## Dependencies
- **Imports:** OrderModule (reads order data, updates payment_status via event)
- **Emits:** `payment.completed` event → OrderPaymentListener marks order as paid

## Endpoints
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/payments/create` | Customer | Create payment URL for order |
| GET | `/payments/vnpay/ipn` | Public | VNPay IPN callback |
| GET | `/payments/vnpay/return` | Public | VNPay return → redirect to FE |
| POST | `/payments/momo/ipn` | Public | MoMo IPN callback |
| GET | `/payments/momo/return` | Public | MoMo return → redirect to FE |
| GET | `/payments/order/:orderId` | Customer | List transactions for order |

## Design Decisions
- Payment is a separate module from Order — owns its own entity and external API integrations
- Order does NOT import Payment — decoupled via `payment.completed` event
- Frontend orchestrates the two-step flow: POST /orders → POST /payments/create → redirect
- IPN callbacks verify HMAC signatures before updating any state (SHA-512 for VNPay, SHA-256 for MoMo)
- Idempotency: if transaction is already completed/failed, IPN is a no-op
- Cron job marks pending transactions as failed after 15 minutes (`*/5 * * * *`)
- Order `payment_status` stays as simple `unpaid`/`paid`; detailed status lives in `payment_transactions.status`
