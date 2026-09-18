import { useTranslation } from 'react-i18next';
import i18n from './config';

/** Enum groups defined in locales/{en,vi}/enums.json. */
export type EnumGroup =
  | 'orderStatus'
  | 'paymentStatus'
  | 'paymentMethod'
  | 'transactionStatus'
  | 'shopStatus'
  | 'couponScope'
  | 'couponDiscountType'
  | 'blockType'
  | 'actorType'
  | 'coinTxType'
  | 'walletTxType'
  | 'withdrawalStatus'
  | 'sellerAppStatus'
  | 'flashCampaignStatus'
  | 'flashItemStatus'
  | 'userRole';

/**
 * Non-reactive enum label lookup (for utils / non-component code).
 * Falls back to the raw value for an unknown key.
 */
export function enumLabel(group: EnumGroup, value: string | null | undefined): string {
  if (!value) return '';
  const te = i18n.t as unknown as (key: string, opts?: Record<string, unknown>) => string;
  return te(`${group}.${value}`, { ns: 'enums', defaultValue: value });
}

/**
 * Reactive enum label lookup for components — subscribes to language changes so
 * chips re-render on switch. Returns the same `(group, value) => label` fn.
 */
export function useEnumLabel() {
  useTranslation('enums');
  return enumLabel;
}
