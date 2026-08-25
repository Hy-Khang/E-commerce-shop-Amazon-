import { lazy, Suspense } from 'react';
import { CheckCircle, Truck, Package, Clock } from 'lucide-react';
import { useShipperDashboardStats } from '../hooks/useShipperDashboardStats';
import { usePeriodParam } from '../hooks/usePeriodParam';
import { StatCard } from '../components/StatCard';
import { PeriodSelector } from '../components/PeriodSelector';
import { ShipperRecentDeliveriesTable } from '../components/ShipperRecentDeliveriesTable';
import { DashboardSkeleton } from '../components/DashboardSkeleton';
import { SectionError } from '../components/SectionError';

const DeliveryChart = lazy(() => import('../components/DeliveryChart'));

function ChartFallback() {
  return <div className="h-80 animate-pulse rounded-xl bg-slate-200" />;
}

export default function ShipperDashboardPage() {
  const [period, setPeriod] = usePeriodParam();
  const { data: stats, isLoading, refetch } = useShipperDashboardStats(period);

  if (isLoading || !stats) return <DashboardSkeleton />;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-jakarta text-3xl font-extrabold tracking-tight text-slate-900">
          Shipper Dashboard
        </h1>
        <PeriodSelector value={period} onChange={setPeriod} />
      </div>

      {stats.summary ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Delivered"
            value={stats.summary.totalDelivered.toLocaleString()}
            icon={CheckCircle}
            color="emerald"
            index={0}
            trend={stats.summary.totalDeliveredChange}
          />
          <StatCard
            title="Active Deliveries"
            value={stats.summary.activeDeliveries.toLocaleString()}
            icon={Truck}
            color="blue"
            index={1}
          />
          <StatCard
            title="Available for Pickup"
            value={stats.summary.availableForPickup.toLocaleString()}
            icon={Package}
            color="amber"
            index={2}
          />
          <StatCard
            title="Delivered Today"
            value={stats.summary.deliveredToday.toLocaleString()}
            icon={Clock}
            color="teal"
            index={3}
          />
        </div>
      ) : (
        <SectionError title="Summary" onRetry={refetch} />
      )}

      <Suspense fallback={<ChartFallback />}>
        <DeliveryChart
          data={stats.deliveriesOverTime}
          granularity={period === '12m' ? 'month' : 'day'}
        />
      </Suspense>

      <ShipperRecentDeliveriesTable deliveries={stats.recentDeliveries} />
    </div>
  );
}
