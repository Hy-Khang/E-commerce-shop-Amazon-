import { useEnumLabel } from '@/common/i18n';
import type { OrderStatus } from '../types/order.types';
import { getStatusColor } from '../utils/order.util';

interface Props {
  status: OrderStatus;
}

export function OrderStatusBadge({ status }: Props) {
  const enumLabel = useEnumLabel();
  const colors = getStatusColor(status);
  const [dotColor, ...textParts] = colors.split(' ');
  const textColor = textParts.join(' ');

  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${textColor}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${dotColor}`} />
      {enumLabel('orderStatus', status)}
    </span>
  );
}
