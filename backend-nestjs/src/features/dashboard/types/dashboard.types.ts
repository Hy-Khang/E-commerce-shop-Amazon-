export interface IMetricChange {
  changePercent: number | null; // null when the previous period was zero
  direction: 'up' | 'down' | 'flat';
}

export interface ISummaryStats {
  // Period-scoped flow metrics (compared against the previous equal window)
  grossRevenue: number;
  grossRevenueChange: IMetricChange;
  collectedRevenue: number;
  collectedRevenueChange: IMetricChange;
  totalOrders: number; // excludes cancelled
  totalOrdersChange: IMetricChange;
  // Absolute snapshots (no comparison)
  totalProducts: number;
  totalUsers: number;
}

export interface IAttentionSignals {
  pendingShops: number;
  returnRequestedOrders: number;
}

export interface ITopShop {
  id: number;
  name: string;
  slug: string;
  revenue: number;
  orderCount: number;
}

export interface IRevenueDataPoint {
  date: string;
  revenue: number;
}

export interface IOrderStatusCount {
  status: string;
  count: number;
}

export interface IRecentOrder {
  id: number;
  customerName: string;
  status: string;
  paymentStatus: string;
  totalAmount: number;
  createdAt: Date;
}

export interface IUserRoleCount {
  role: string;
  count: number;
}

export interface ITopProduct {
  id: number;
  name: string;
  thumbnailUrl: string | null;
  totalOrdered: number;
  totalRevenue: number;
}

export interface ILowStockAlert {
  id: number;
  productName: string;
  sku: string;
  option1: string | null;
  option2: string | null;
  stockQuantity: number;
}

export interface IDashboardStats {
  summary: ISummaryStats | null;
  revenueOverTime: IRevenueDataPoint[];
  ordersByStatus: IOrderStatusCount[];
  recentOrders: IRecentOrder[];
  usersByRole: IUserRoleCount[];
  topProducts: ITopProduct[];
  lowStockAlerts: ILowStockAlert[];
  attentionSignals: IAttentionSignals | null;
  topShops: ITopShop[];
}

export interface ISellerSummaryStats {
  // Period-scoped flow metrics (compared against the previous equal window)
  grossRevenue: number;
  grossRevenueChange: IMetricChange;
  collectedRevenue: number;
  collectedRevenueChange: IMetricChange;
  totalOrders: number; // excludes cancelled
  totalOrdersChange: IMetricChange;
  // Absolute snapshots (no comparison)
  totalProducts: number;
  lowStockCount: number;
}

export interface ISellerRecentOrder {
  id: number;
  customerName: string;
  status: string;
  paymentStatus: string;
  sellerSubtotal: number;
  createdAt: Date;
}

export interface ISellerDashboardStats {
  summary: ISellerSummaryStats | null;
  revenueOverTime: IRevenueDataPoint[];
  topProducts: ITopProduct[];
  recentOrders: ISellerRecentOrder[];
  lowStockAlerts: ILowStockAlert[];
}

export interface IShipperSummaryStats {
  /** Deliveries completed within the selected period (flow metric). */
  totalDelivered: number;
  totalDeliveredChange: IMetricChange;
  activeDeliveries: number;
  availableForPickup: number;
  deliveredToday: number;
}

export interface IShipperRecentDelivery {
  id: number;
  customerName: string;
  status: string;
  totalAmount: number;
  shippingAddress: string;
  createdAt: Date;
  deliveredAt: Date | null;
}

export interface IShipperDeliveryDataPoint {
  date: string;
  count: number;
}

export interface IShipperDashboardStats {
  summary: IShipperSummaryStats | null;
  deliveriesOverTime: IShipperDeliveryDataPoint[];
  recentDeliveries: IShipperRecentDelivery[];
}
