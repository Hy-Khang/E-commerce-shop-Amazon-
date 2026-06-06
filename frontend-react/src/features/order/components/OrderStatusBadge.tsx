import { ORDER_STATUS_LABELS } from '@/common/constants/routes';
import type { OrderStatus } from '../types/order.types';
import { getStatusColor } from '../utils/order.util';

interface Props {
  status: OrderStatus;
}

export function OrderStatusBadge({ status }: Props) {
  const colors = getStatusColor(status);
  const [dotColor, textColor] = colors.split(' ');

  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${textColor}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${dotColor}`} />
      {ORDER_STATUS_LABELS[status] ?? status}
    </span>
  );
}
