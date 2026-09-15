import { lazy, Suspense } from 'react';
import { DollarSign, Banknote, ShoppingCart, Package, AlertTriangle, Percent, Wallet } from 'lucide-react';
import { formatPrice } from '@/common/utils/format.util';
import { useSellerDashboardStats } from '../hooks/useSellerDashboardStats';
import { usePeriodParam } from '../hooks/usePeriodParam';
import { StatCard } from '../components/StatCard';
import { PeriodSelector } from '../components/PeriodSelector';
import { DashboardSection } from '../components/DashboardSection';
import { SellerRecentOrdersTable } from '../components/SellerRecentOrdersTable';
import { SellerTopProductsList } from '../components/SellerTopProductsList';
import { SellerLowStockAlerts } from '../components/SellerLowStockAlerts';
import { DashboardSkeleton } from '../components/DashboardSkeleton';
import { SectionError } from '../components/SectionError';

const RevenueChart = lazy(() => import('../components/RevenueChart'));

function ChartFallback() {
  return <div className="h-80 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />;
}

export default function SellerDashboardPage() {
  const [period, setPeriod] = usePeriodParam();
  const { data: stats, isLoading, refetch } = useSellerDashboardStats(period);

  if (isLoading || !stats) return <DashboardSkeleton />;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-jakarta text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
          Seller Dashboard
        </h1>
        <PeriodSelector value={period} onChange={setPeriod} />
      </div>

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
            title="Orders with My Items"
            value={stats.summary.totalOrders.toLocaleString()}
            icon={ShoppingCart}
            color="blue"
            index={2}
            trend={stats.summary.totalOrdersChange}
          />
          <StatCard
            title="My Products"
            value={stats.summary.totalProducts.toLocaleString()}
            icon={Package}
            color="violet"
            index={3}
          />
          <StatCard
            title="Low Stock"
            value={stats.summary.lowStockCount.toLocaleString()}
            icon={AlertTriangle}
            color="amber"
            index={4}
          />
        </div>
      ) : (
        <SectionError title="Summary" onRetry={refetch} />
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Platform Commission"
          value={formatPrice(stats.commissionTotal)}
          icon={Percent}
          color="violet"
          index={0}
        />
        <StatCard
          title="Net Revenue"
          value={formatPrice(stats.netRevenue)}
          icon={Wallet}
          color="emerald"
          index={1}
        />
      </div>

      <DashboardSection label="Performance">
        <Suspense fallback={<ChartFallback />}>
          <RevenueChart
            data={stats.revenueOverTime}
            granularity={period === '12m' ? 'month' : 'day'}
          />
        </Suspense>
      </DashboardSection>

      <DashboardSection label="Orders & Products">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <SellerRecentOrdersTable orders={stats.recentOrders} />
          <SellerTopProductsList products={stats.topProducts} />
        </div>
      </DashboardSection>

      <DashboardSection label="Inventory">
        <SellerLowStockAlerts alerts={stats.lowStockAlerts} />
      </DashboardSection>
    </div>
  );
}
