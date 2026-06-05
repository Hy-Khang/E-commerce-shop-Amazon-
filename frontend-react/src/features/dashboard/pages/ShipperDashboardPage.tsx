import { Truck, BarChart3 } from 'lucide-react';

export default function ShipperDashboardPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Shipper Dashboard</h1>
      <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-6">
        <div className="flex items-start gap-4">
          <BarChart3 className="mt-0.5 h-6 w-6 text-emerald-600" />
          <div>
            <h2 className="text-lg font-semibold text-emerald-900">Welcome to Shipper Portal</h2>
            <p className="mt-1 text-sm text-emerald-700">
              Your delivery dashboard is coming soon. You&apos;ll be able to track delivery stats, earnings, and performance here.
            </p>
          </div>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex items-center gap-3 rounded-lg border p-4 opacity-50">
          <Truck className="h-5 w-5 text-gray-400" />
          <div>
            <div className="text-sm font-medium text-gray-900">Deliveries</div>
            <div className="text-xs text-gray-500">Coming soon</div>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-lg border p-4 opacity-50">
          <BarChart3 className="h-5 w-5 text-gray-400" />
          <div>
            <div className="text-sm font-medium text-gray-900">Analytics</div>
            <div className="text-xs text-gray-500">Coming soon</div>
          </div>
        </div>
      </div>
    </div>
  );
}
