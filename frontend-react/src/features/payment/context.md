# Payment Feature

## Purpose
Online payment via VNPay and MoMo gateways. Handles payment creation (redirect to gateway), result display, transaction history, and retry flow.

## Pages
- `PaymentResultPage` — displays payment success/failure after gateway redirect, with retry option

## Components
- `PaymentTransactionList` — reusable component showing transaction history for an order (customer + admin variants)

## API Dependencies
- `POST /payments/create` — create payment URL for an order (returns `payment_url`)
- `GET /payments/order/:orderId` — list payment transactions for an order

## State
- Server state via TanStack Query (staleTime: 1 min)
- No Zustand store needed

## Cross-Feature
- Imported by `order` feature: CheckoutPage uses `useCreatePayment`, OrderDetailPage uses `PaymentTransactionList` + `useCreatePayment`
- Imports `useOrder` from `@/features/order` in PaymentResultPage
- Payment result route: `/checkout/payment-result?orderId=X&status=success|failed`

## Flow
1. CheckoutPage: COD → navigate to success page; VNPay/MoMo → POST /orders → POST /payments/create → `window.location.href = payment_url`
2. Gateway processes payment → calls backend IPN → redirects user to `/checkout/payment-result`
3. PaymentResultPage: shows result, offers retry on failure
4. OrderDetailPage: shows "Pay Now" button if unpaid + pending, shows transaction list for non-COD orders
