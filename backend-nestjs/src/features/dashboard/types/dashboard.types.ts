export interface ISummaryStats {
  grossRevenue: number;
  collectedRevenue: number;
  totalOrders: number;
  totalProducts: number;
  totalUsers: number;
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
}

export interface ISellerSummaryStats {
  grossRevenue: number;
  collectedRevenue: number;
  totalOrders: number;
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
