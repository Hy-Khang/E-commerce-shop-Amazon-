import { OrderStatus } from '../../../common/constants';

export const VALID_STATUS_TRANSITIONS: Record<string, string[]> = {
  [OrderStatus.Pending]: [OrderStatus.Confirmed, OrderStatus.Cancelled],
  [OrderStatus.Confirmed]: [OrderStatus.Shipping, OrderStatus.Cancelled],
  [OrderStatus.Shipping]: [OrderStatus.Delivered],
  [OrderStatus.Delivered]: [],
  [OrderStatus.Cancelled]: [],
};

export const DEFAULT_SHIPPING_FEE = 30000;

export interface IShippingAddressSnapshot {
  full_name: string;
  phone: string;
  address_line: string;
  city: string;
}
