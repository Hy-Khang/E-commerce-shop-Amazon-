import { Package, ShoppingCart, BarChart3 } from 'lucide-react';

export default function SellerDashboardPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Seller Dashboard</h1>
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-6">
        <div className="flex items-start gap-4">
          <BarChart3 className="mt-0.5 h-6 w-6 text-amber-600" />
          <div>
            <h2 className="text-lg font-semibold text-amber-900">Welcome to Seller Center</h2>
            <p className="mt-1 text-sm text-amber-700">
              Your seller analytics dashboard is coming soon. You&apos;ll be able to track revenue, orders, and product performance here.
            </p>
          </div>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <a href="/seller/products" className="flex items-center gap-3 rounded-lg border p-4 transition-colors hover:bg-gray-50">
          <Package className="h-5 w-5 text-gray-400" />
          <div>
            <div className="text-sm font-medium text-gray-900">Manage Products</div>
            <div className="text-xs text-gray-500">Add, edit, and manage your product listings</div>
          </div>
        </a>
        <div className="flex items-center gap-3 rounded-lg border p-4 opacity-50">
          <ShoppingCart className="h-5 w-5 text-gray-400" />
          <div>
            <div className="text-sm font-medium text-gray-900">Orders</div>
            <div className="text-xs text-gray-500">Coming soon</div>
          </div>
        </div>
      </div>
    </div>
  );
}
