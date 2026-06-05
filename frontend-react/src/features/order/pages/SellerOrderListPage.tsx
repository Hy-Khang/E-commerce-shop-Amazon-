import { ShoppingCart } from 'lucide-react';

export default function SellerOrderListPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
      <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
        <ShoppingCart className="mx-auto h-12 w-12 text-gray-300" />
        <h2 className="mt-4 text-lg font-medium text-gray-900">Coming Soon</h2>
        <p className="mt-2 text-sm text-gray-500">
          Seller order management is under development. You&apos;ll be able to view and manage orders containing your products here.
        </p>
      </div>
    </div>
  );
}
