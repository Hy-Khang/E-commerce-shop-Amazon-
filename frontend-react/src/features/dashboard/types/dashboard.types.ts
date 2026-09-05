export type DashboardPeriod = '7d' | '30d' | '90d' | '12m';

export type RevenueGranularity = 'day' | 'month';

export interface MetricChange {
  changePercent: number | null; // null when the previous period was zero
  direction: 'up' | 'down' | 'flat';
}

export interface DashboardStats {
  summary: SummaryStats | null;
  revenueOverTime: RevenueDataPoint[];
  ordersByStatus: OrderStatusCount[];
  recentOrders: RecentOrder[];
  usersByRole: UserRoleCount[];
  topProducts: TopProduct[];
  lowStockAlerts: LowStockAlert[];
  attentionSignals: AttentionSignals | null;
  topShops: TopShop[];
  commissionRevenue: number;
}

export interface SummaryStats {
  grossRevenue: number;
  grossRevenueChange: MetricChange;
  collectedRevenue: number;
  collectedRevenueChange: MetricChange;
  totalOrders: number;
  totalOrdersChange: MetricChange;
  totalProducts: number;
  totalUsers: number;
}

export interface AttentionSignals {
  pendingShops: number;
  returnRequestedOrders: number;
}

export interface TopShop {
  id: number;
  name: string;
  slug: string;
  revenue: number;
  orderCount: number;
}

export interface RevenueDataPoint {
  date: string;
  revenue: number;
}

export interface OrderStatusCount {
  status: string;
  count: number;
}

export interface RecentOrder {
  id: number;
  customerName: string;
  status: string;
  paymentStatus: string;
  totalAmount: number;
  createdAt: string;
}

export interface UserRoleCount {
  role: string;
  count: number;
}

export interface TopProduct {
  id: number;
  name: string;
  thumbnailUrl: string | null;
  totalOrdered: number;
  totalRevenue: number;
}

export interface LowStockAlert {
  id: number;
  productName: string;
  sku: string;
  option1: string | null;
  option2: string | null;
  stockQuantity: number;
}

export interface SellerSummaryStats {
  grossRevenue: number;
  grossRevenueChange: MetricChange;
  collectedRevenue: number;
  collectedRevenueChange: MetricChange;
  totalOrders: number;
  totalOrdersChange: MetricChange;
  totalProducts: number;
  lowStockCount: number;
}

export interface SellerRecentOrder {
  id: number;
  customerName: string;
  status: string;
  paymentStatus: string;
  sellerSubtotal: number;
  createdAt: string;
}

export interface SellerDashboardStats {
  summary: SellerSummaryStats | null;
  revenueOverTime: RevenueDataPoint[];
  topProducts: TopProduct[];
  recentOrders: SellerRecentOrder[];
  lowStockAlerts: LowStockAlert[];
  commissionTotal: number;
  netRevenue: number;
}

export interface ShipperSummaryStats {
  /** Deliveries completed within the selected period (flow metric). */
  totalDelivered: number;
  totalDeliveredChange: MetricChange;
  activeDeliveries: number;
  availableForPickup: number;
  deliveredToday: number;
}

export interface ShipperDeliveryDataPoint {
  date: string;
  count: number;
}

export interface ShipperRecentDelivery {
  id: number;
  customerName: string;
  status: string;
  totalAmount: number;
  shippingAddress: string;
  createdAt: string;
  deliveredAt: string | null;
}

export interface ShipperDashboardStats {
  summary: ShipperSummaryStats | null;
  deliveriesOverTime: ShipperDeliveryDataPoint[];
  recentDeliveries: ShipperRecentDelivery[];
}
