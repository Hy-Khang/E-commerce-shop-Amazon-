export interface ISummaryStats {
  totalRevenue: number;
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
