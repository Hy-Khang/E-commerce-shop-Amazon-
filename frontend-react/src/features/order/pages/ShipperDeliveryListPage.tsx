import { Truck } from 'lucide-react';

export default function ShipperDeliveryListPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Deliveries</h1>
      <div className="rounded-lg border border-slate-200 bg-white p-8 text-center">
        <Truck className="mx-auto h-12 w-12 text-slate-300" />
        <h2 className="mt-4 text-lg font-medium text-slate-900">Coming Soon</h2>
        <p className="mt-2 text-sm text-slate-500">
          The delivery management system is under development. You&apos;ll be able to view assigned deliveries, update delivery status, and track your routes here.
        </p>
      </div>
    </div>
  );
}
