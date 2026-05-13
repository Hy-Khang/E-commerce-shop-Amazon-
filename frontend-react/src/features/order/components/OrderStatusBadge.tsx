import { ORDER_STATUS_LABELS } from '@/common/constants/routes';
import type { OrderStatus } from '../types/order.types';
import { getStatusColor } from '../utils/order.util';

interface Props {
  status: OrderStatus;
}

export function OrderStatusBadge({ status }: Props) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(status)}`}>
      {ORDER_STATUS_LABELS[status] ?? status}
    </span>
  );
}
