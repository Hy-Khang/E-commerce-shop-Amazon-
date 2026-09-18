import { useTranslation } from 'react-i18next';
import { useEnumLabel } from '@/common/i18n';
import type { OrderStatus } from '../types/order.types';

const ORDER_STATUS_VALUES: (OrderStatus | undefined)[] = [
  undefined,
  'pending',
  'confirmed',
  'shipping',
  'delivered',
  'completed',
  'return_requested',
  'cancelled',
];

interface Props {
  activeStatus: OrderStatus | undefined;
  onChange: (status: OrderStatus | undefined) => void;
}

export function OrderStatusTabs({ activeStatus, onChange }: Props) {
  const { t } = useTranslation('order');
  const enumLabel = useEnumLabel();

  return (
    <div className="overflow-x-auto border-b border-border-default">
      <div className="flex">
        {ORDER_STATUS_VALUES.map((value) => {
          const isActive = activeStatus === value;
          const label = value ? enumLabel('orderStatus', value) : t('statusTabs.all');
          return (
            <button
              key={value ?? 'all'}
              type="button"
              onClick={() => onChange(value)}
              className={`shrink-0 px-4 py-2.5 text-sm transition-colors ${
                isActive
                  ? 'border-b-2 border-border-brand font-semibold text-text-brand'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
