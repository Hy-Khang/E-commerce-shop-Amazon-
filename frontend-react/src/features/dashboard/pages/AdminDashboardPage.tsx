import { lazy, Suspense } from 'react';
import { DollarSign, ShoppingCart, Package, Users } from 'lucide-react';
import { formatPrice } from '@/common/utils/format.util';
import { useDashboardStats } from '../hooks/useDashboardStats';
import { StatCard } from '../components/StatCard';
import { RecentOrdersTable } from '../components/RecentOrdersTable';
import { UserRoleBreakdown } from '../components/UserRoleBreakdown';
import { TopProductsList } from '../components/TopProductsList';
import { LowStockAlerts } from '../components/LowStockAlerts';
import { DashboardSkeleton } from '../components/DashboardSkeleton';
import { SectionError } from '../components/SectionError';

const RevenueChart = lazy(() => import('../components/RevenueChart'));
const OrderStatusChart = lazy(() => import('../components/OrderStatusChart'));

function ChartFallback() {
  return <div className="h-80 animate-pulse rounded-xl bg-gray-200" />;
}

export default function AdminDashboardPage() {
  const { data: stats, isLoading, refetch } = useDashboardStats();

  if (isLoading || !stats) return <DashboardSkeleton />;

  return (
    <div className="space-y-8">
      <h1 className="font-jakarta text-3xl font-extrabold tracking-tight text-gray-900">
        Dashboard
      </h1>

      {/* Summary Cards */}
      {stats.summary ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Revenue"
            value={formatPrice(stats.summary.totalRevenue)}
            icon={DollarSign}
            color="emerald"
            index={0}
          />
          <StatCard
            title="Total Orders"
            value={stats.summary.totalOrders.toLocaleString()}
            icon={ShoppingCart}
            color="blue"
            index={1}
          />
          <StatCard
            title="Active Products"
            value={stats.summary.totalProducts.toLocaleString()}
            icon={Package}
            color="violet"
            index={2}
          />
          <StatCard
            title="Active Users"
            value={stats.summary.totalUsers.toLocaleString()}
            icon={Users}
            color="amber"
            index={3}
          />
        </div>
      ) : (
        <SectionError title="Summary" onRetry={refetch} />
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {stats.revenueOverTime.length > 0 ? (
          <Suspense fallback={<ChartFallback />}>
            <RevenueChart data={stats.revenueOverTime} />
          </Suspense>
        ) : (
          <SectionError title="Revenue Trend" onRetry={refetch} />
        )}

        {stats.ordersByStatus.length > 0 ? (
          <Suspense fallback={<ChartFallback />}>
            <OrderStatusChart data={stats.ordersByStatus} />
          </Suspense>
        ) : (
          <SectionError title="Order Status" onRetry={refetch} />
        )}
      </div>

      {/* Info Sections */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <RecentOrdersTable orders={stats.recentOrders} />
        <div className="space-y-6">
          {stats.usersByRole.length > 0 && (
            <UserRoleBreakdown roles={stats.usersByRole} />
          )}
          <TopProductsList products={stats.topProducts} />
        </div>
      </div>

      {/* Low Stock Alerts */}
      <LowStockAlerts alerts={stats.lowStockAlerts} />
    </div>
  );
}
