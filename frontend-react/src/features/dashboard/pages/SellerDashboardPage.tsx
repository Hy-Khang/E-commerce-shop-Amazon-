import { lazy, Suspense } from 'react';
import { DollarSign, ShoppingCart, Package, AlertTriangle } from 'lucide-react';
import { formatPrice } from '@/common/utils/format.util';
import { useSellerDashboardStats } from '../hooks/useSellerDashboardStats';
import { StatCard } from '../components/StatCard';
import { SellerRecentOrdersTable } from '../components/SellerRecentOrdersTable';
import { SellerTopProductsList } from '../components/SellerTopProductsList';
import { SellerLowStockAlerts } from '../components/SellerLowStockAlerts';
import { DashboardSkeleton } from '../components/DashboardSkeleton';
import { SectionError } from '../components/SectionError';

const RevenueChart = lazy(() => import('../components/RevenueChart'));

function ChartFallback() {
  return <div className="h-80 animate-pulse rounded-xl bg-gray-200" />;
}

export default function SellerDashboardPage() {
  const { data: stats, isLoading, refetch } = useSellerDashboardStats();

  if (isLoading || !stats) return <DashboardSkeleton />;

  return (
    <div className="space-y-8">
      <h1 className="font-jakarta text-3xl font-extrabold tracking-tight text-gray-900">
        Seller Dashboard
      </h1>

      {stats.summary ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="My Revenue"
            value={formatPrice(stats.summary.totalRevenue)}
            icon={DollarSign}
            color="emerald"
            index={0}
          />
          <StatCard
            title="Orders with My Items"
            value={stats.summary.totalOrders.toLocaleString()}
            icon={ShoppingCart}
            color="blue"
            index={1}
          />
          <StatCard
            title="My Products"
            value={stats.summary.totalProducts.toLocaleString()}
            icon={Package}
            color="violet"
            index={2}
          />
          <StatCard
            title="Low Stock"
            value={stats.summary.lowStockCount.toLocaleString()}
            icon={AlertTriangle}
            color="amber"
            index={3}
          />
        </div>
      ) : (
        <SectionError title="Summary" onRetry={refetch} />
      )}

      {stats.revenueOverTime.length > 0 ? (
        <Suspense fallback={<ChartFallback />}>
          <RevenueChart data={stats.revenueOverTime} />
        </Suspense>
      ) : (
        <SectionError title="Revenue Trend" onRetry={refetch} />
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <SellerRecentOrdersTable orders={stats.recentOrders} />
        <SellerTopProductsList products={stats.topProducts} />
      </div>

      <SellerLowStockAlerts alerts={stats.lowStockAlerts} />
    </div>
  );
}
