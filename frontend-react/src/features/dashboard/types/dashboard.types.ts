export interface DashboardStats {
  summary: SummaryStats | null;
  revenueOverTime: RevenueDataPoint[];
  ordersByStatus: OrderStatusCount[];
  recentOrders: RecentOrder[];
  usersByRole: UserRoleCount[];
  topProducts: TopProduct[];
  lowStockAlerts: LowStockAlert[];
}

export interface SummaryStats {
  grossRevenue: number;
  collectedRevenue: number;
  totalOrders: number;
  totalProducts: number;
  totalUsers: number;
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
  collectedRevenue: number;
  totalOrders: number;
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
}
