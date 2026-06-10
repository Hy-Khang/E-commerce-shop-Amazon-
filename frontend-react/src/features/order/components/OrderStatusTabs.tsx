import type { OrderStatus } from '../types/order.types';

const ORDER_STATUS_TABS: { label: string; value: OrderStatus | undefined }[] = [
  { label: 'All', value: undefined },
  { label: 'Pending', value: 'pending' },
  { label: 'Confirmed', value: 'confirmed' },
  { label: 'Shipping', value: 'shipping' },
  { label: 'Delivered', value: 'delivered' },
  { label: 'Completed', value: 'completed' },
  { label: 'Return Requested', value: 'return_requested' },
  { label: 'Cancelled', value: 'cancelled' },
];

interface Props {
  activeStatus: OrderStatus | undefined;
  onChange: (status: OrderStatus | undefined) => void;
}

export function OrderStatusTabs({ activeStatus, onChange }: Props) {
  return (
    <div className="overflow-x-auto border-b border-border-default">
      <div className="flex">
        {ORDER_STATUS_TABS.map((tab) => {
          const isActive = activeStatus === tab.value;
          return (
            <button
              key={tab.label}
              type="button"
              onClick={() => onChange(tab.value)}
              className={`shrink-0 px-4 py-2.5 text-sm transition-colors ${
                isActive
                  ? 'border-b-2 border-border-brand font-semibold text-text-brand'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
