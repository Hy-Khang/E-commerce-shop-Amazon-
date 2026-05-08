export const ROUTES = {
  HOME: '/',
  PRODUCTS: '/products',
  PRODUCT_DETAIL: (slug: string) => `/products/${slug}`,
  CATEGORY: (slug: string) => `/categories/${slug}`,

  LOGIN: '/login',
  REGISTER: '/register',

  CART: '/cart',
  CHECKOUT: '/checkout',

  ORDERS: '/orders',
  ORDER_DETAIL: (id: number) => `/orders/${id}`,

  PROFILE: '/profile',
  ADDRESSES: '/profile/addresses',

  ADMIN_PRODUCTS: '/admin/products',
  ADMIN_PRODUCT_CREATE: '/admin/products/new',
  ADMIN_PRODUCT_EDIT: (id: number) => `/admin/products/${id}/edit`,
  ADMIN_ORDERS: '/admin/orders',
  ADMIN_ORDER_DETAIL: (id: number) => `/admin/orders/${id}`,
} as const;

export const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  shipping: 'Shipping',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  unpaid: 'Unpaid',
  paid: 'Paid',
};

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cod: 'Cash on Delivery',
  banking: 'Bank Transfer',
  momo: 'MoMo',
};
