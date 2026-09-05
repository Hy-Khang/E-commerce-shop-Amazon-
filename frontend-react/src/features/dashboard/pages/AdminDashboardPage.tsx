import { lazy, Suspense } from 'react';
import { DollarSign, Banknote, ShoppingCart, Package, Users, Percent } from 'lucide-react';
import { formatPrice } from '@/common/utils/format.util';
import { useDashboardStats } from '../hooks/useDashboardStats';
import { usePeriodParam } from '../hooks/usePeriodParam';
import { useDashboardSections } from '../hooks/useDashboardSections';
import { StatCard } from '../components/StatCard';
import { PeriodSelector } from '../components/PeriodSelector';
import { DashboardCustomizeMenu } from '../components/DashboardCustomizeMenu';
import { DashboardSection } from '../components/DashboardSection';
import { AttentionSignals } from '../components/AttentionSignals';
import { TopShopsList } from '../components/TopShopsList';
import { RecentOrdersTable } from '../components/RecentOrdersTable';
import { UserRoleBreakdown } from '../components/UserRoleBreakdown';
import { TopProductsList } from '../components/TopProductsList';
import { LowStockAlerts } from '../components/LowStockAlerts';
import { DashboardSkeleton } from '../components/DashboardSkeleton';
import { SectionError } from '../components/SectionError';

const RevenueChart = lazy(() => import('../components/RevenueChart'));
const OrderStatusChart = lazy(() => import('../components/OrderStatusChart'));

function ChartFallback() {
  return <div className="h-80 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />;
}

export default function AdminDashboardPage() {
  const [period, setPeriod] = usePeriodParam();
  const { visible, toggle } = useDashboardSections();
  const { data: stats, isLoading, refetch } = useDashboardStats(period);

  if (isLoading || !stats) return <DashboardSkeleton />;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-jakarta text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
          Dashboard
        </h1>
        <div className="flex items-center gap-3">
          <PeriodSelector value={period} onChange={setPeriod} />
          <DashboardCustomizeMenu visible={visible} onToggle={toggle} />
        </div>
      </div>

      {/* Operator queue (admin-only, always shown when non-zero) */}
      {stats.attentionSignals && (
        <AttentionSignals signals={stats.attentionSignals} />
      )}

      {/* Summary KPIs (always shown) */}
      {stats.summary ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard
            title="Gross Revenue"
            value={formatPrice(stats.summary.grossRevenue)}
            icon={DollarSign}
            color="emerald"
            index={0}
            trend={stats.summary.grossRevenueChange}
          />
          <StatCard
            title="Collected Revenue"
            value={formatPrice(stats.summary.collectedRevenue)}
            icon={Banknote}
            color="teal"
            index={1}
            trend={stats.summary.collectedRevenueChange}
          />
          <StatCard
            title="Orders"
            value={stats.summary.totalOrders.toLocaleString()}
            icon={ShoppingCart}
            color="blue"
            index={2}
            trend={stats.summary.totalOrdersChange}
          />
          <StatCard
            title="Active Products"
            value={stats.summary.totalProducts.toLocaleString()}
            icon={Package}
            color="violet"
            index={3}
          />
          <StatCard
            title="Active Users"
            value={stats.summary.totalUsers.toLocaleString()}
            icon={Users}
            color="amber"
            index={4}
          />
          <StatCard
            title="Commission Revenue"
            value={formatPrice(stats.commissionRevenue)}
            icon={Percent}
            color="violet"
            index={5}
          />
        </div>
      ) : (
        <SectionError title="Summary" onRetry={refetch} />
      )}

      {/* Performance — revenue trend + order status */}
      {visible.performance && (
        <DashboardSection label="Performance">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Suspense fallback={<ChartFallback />}>
              <RevenueChart
                data={stats.revenueOverTime}
                granularity={period === '12m' ? 'month' : 'day'}
              />
            </Suspense>

            {stats.ordersByStatus.length > 0 ? (
              <Suspense fallback={<ChartFallback />}>
                <OrderStatusChart data={stats.ordersByStatus} />
              </Suspense>
            ) : (
              <SectionError title="Order Status" onRetry={refetch} />
            )}
          </div>
        </DashboardSection>
      )}

      {/* Orders — recent orders (full width) */}
      {visible.orders && (
        <DashboardSection label="Orders">
          <RecentOrdersTable orders={stats.recentOrders} />
        </DashboardSection>
      )}

      {/* Marketplace & Users — balanced 3-up row */}
      {visible.marketplace && (
        <DashboardSection label="Marketplace & Users">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <TopShopsList shops={stats.topShops} />
            <TopProductsList products={stats.topProducts} />
            {stats.usersByRole.length > 0 && (
              <UserRoleBreakdown roles={stats.usersByRole} />
            )}
          </div>
        </DashboardSection>
      )}

      {/* Inventory — low stock (only when there is something to show) */}
      {visible.inventory && stats.lowStockAlerts.length > 0 && (
        <DashboardSection label="Inventory">
          <LowStockAlerts alerts={stats.lowStockAlerts} />
        </DashboardSection>
      )}
    </div>
  );
}
