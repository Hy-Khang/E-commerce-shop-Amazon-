import { OrderStatus } from '../../../common/constants';

export const ADMIN_STATUS_TRANSITIONS: Record<string, string[]> = {
  [OrderStatus.Pending]: [OrderStatus.Confirmed, OrderStatus.Cancelled],
  [OrderStatus.Confirmed]: [OrderStatus.Shipping, OrderStatus.Cancelled],
  [OrderStatus.Shipping]: [OrderStatus.Delivered, OrderStatus.Cancelled],
  [OrderStatus.Delivered]: [OrderStatus.Completed],
  [OrderStatus.Completed]: [],
  [OrderStatus.ReturnRequested]: [OrderStatus.Completed, OrderStatus.Cancelled],
  [OrderStatus.Cancelled]: [],
};

export const CUSTOMER_STATUS_TRANSITIONS: Record<string, string[]> = {
  [OrderStatus.Pending]: [OrderStatus.Cancelled],
  [OrderStatus.Delivered]: [OrderStatus.Completed, OrderStatus.ReturnRequested],
};

export const SELLER_STATUS_TRANSITIONS: Record<string, string[]> = {
  [OrderStatus.Pending]: [OrderStatus.Confirmed],
  [OrderStatus.Confirmed]: [OrderStatus.Shipping],
  [OrderStatus.Shipping]: [OrderStatus.Delivered],
};

export const SHIPPER_STATUS_TRANSITIONS: Record<string, string[]> = {
  [OrderStatus.Confirmed]: [OrderStatus.Shipping],
  [OrderStatus.Shipping]: [OrderStatus.Delivered],
};

/**
 * Flat fallback fee (₫) used when a distance can't be computed — the shop has no
 * pickup coordinates, the delivery address has none, or a strategy fails. Keeps
 * checkout working for legacy/manual addresses (backward compatible).
 */
export const DEFAULT_SHIPPING_FEE = 30000;

/**
 * Distance-based shipping (H1 — Haversine). A tiered fee: a flat base covers the
 * first `SHIPPING_BASE_KM` km, then `SHIPPING_PER_KM` per extra km, rounded to
 * the nearest 1.000 ₫ and clamped to `[SHIPPING_MIN_FEE, SHIPPING_MAX_FEE]`.
 * Local delivery stays cheap; cross-province hits the cap. Independent of any
 * carrier API or administrative name → immune to the 2025 province merger.
 */
export const SHIPPING_BASE_FEE = 15000;
export const SHIPPING_BASE_KM = 5;
export const SHIPPING_PER_KM = 3000;
export const SHIPPING_MIN_FEE = 15000;
export const SHIPPING_MAX_FEE = 60000;
export const SHIPPING_ROUNDING = 1000;

export interface IShippingAddressSnapshot {
  full_name: string;
  phone: string;
  address_line: string;
  city: string;
  latitude?: number | null;
  longitude?: number | null;
}
