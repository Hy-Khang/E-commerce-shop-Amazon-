import { Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { Drawer } from '@/common/components/ui/Drawer';
import { usePagination } from '@/common/hooks/usePagination';
import { formatPrice, formatDate } from '@/common/utils/format.util';
import { ROUTES } from '@/common/constants/routes';
import { useAdminCouponUsages } from '../hooks/useAdminCouponUsages';

interface Props {
  couponId: number | null;
  couponCode?: string;
  onClose: () => void;
}

export function AdminCouponUsagesDrawer({ couponId, couponCode, onClose }: Props) {
  const { params } = usePagination({ limit: 10 });
  const { data: usages, isLoading } = useAdminCouponUsages(couponId ?? 0, params);

  return (
    <Drawer
      open={couponId !== null}
      onClose={onClose}
      title={couponCode ? `Usages · ${couponCode}` : 'Coupon Usages'}
      variant="modal"
      size="xl"
    >
      {isLoading ? (
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400 dark:text-slate-500" />
        </div>
      ) : !usages || usages.data.length === 0 ? (
        <p className="py-10 text-center text-sm text-slate-500 dark:text-slate-400">
          This coupon has not been used yet.
        </p>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-slate-500 dark:text-slate-400">{usages.meta.total} total usage(s)</p>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="admin-table-header">
                  <th className="px-4 py-3 text-left">Order</th>
                  <th className="px-4 py-3 text-left">User</th>
                  <th className="px-4 py-3 text-left">Discount</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {usages.data.map((usage) => (
                  <tr key={usage.id} className="hover:bg-slate-50/50 transition-colors dark:hover:bg-slate-800/50">
                    <td className="px-4 py-3 text-sm">
                      <Link
                        to={ROUTES.ADMIN_ORDER_DETAIL(usage.order_id)}
                        className="font-mono text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300"
                      >
                        #{usage.order_id}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">
                      {usage.user_email || `User #${usage.user_id}`}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">
                      {formatPrice(usage.discount_amount)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${
                        usage.status === 'applied' ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-400'
                      }`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${
                          usage.status === 'applied' ? 'bg-emerald-500' : 'bg-amber-500'
                        }`} />
                        {usage.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">{formatDate(usage.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Drawer>
  );
}
