import { OrderStatus } from '../../../common/constants';

export const VALID_STATUS_TRANSITIONS: Record<string, string[]> = {
  [OrderStatus.Pending]: [OrderStatus.Confirmed, OrderStatus.Cancelled],
  [OrderStatus.Confirmed]: [OrderStatus.Shipping, OrderStatus.Cancelled],
  [OrderStatus.Shipping]: [OrderStatus.Delivered, OrderStatus.Cancelled],
  [OrderStatus.Delivered]: [],
  [OrderStatus.Cancelled]: [],
};

export const SELLER_STATUS_TRANSITIONS: Record<string, string[]> = {
  [OrderStatus.Pending]: [OrderStatus.Confirmed],
  [OrderStatus.Confirmed]: [OrderStatus.Shipping],
  [OrderStatus.Shipping]: [OrderStatus.Delivered],
};

export const DEFAULT_SHIPPING_FEE = 30000;

export interface IShippingAddressSnapshot {
  full_name: string;
  phone: string;
  address_line: string;
  city: string;
}
