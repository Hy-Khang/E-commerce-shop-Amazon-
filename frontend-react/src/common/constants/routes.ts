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
  MY_REVIEWS: '/profile/reviews',
  WISHLIST: '/wishlist',

  ADMIN_PRODUCTS: '/admin/products',
  ADMIN_PRODUCT_CREATE: '/admin/products/new',
  ADMIN_PRODUCT_EDIT: (id: number) => `/admin/products/${id}/edit`,
  ADMIN_ORDERS: '/admin/orders',
  ADMIN_ORDER_DETAIL: (id: number) => `/admin/orders/${id}`,
  ADMIN_ROLES: '/admin/roles',
  ADMIN_USERS: '/admin/users',
  ADMIN_USER_DETAIL: (id: number) => `/admin/users/${id}`,
  ADMIN_CATEGORIES: '/admin/categories',
  ADMIN_CATEGORY_CREATE: '/admin/categories/new',
  ADMIN_CATEGORY_EDIT: (id: number) => `/admin/categories/${id}/edit`,
  ADMIN_REVIEWS: '/admin/reviews',
  ADMIN_WISHLIST: '/admin/wishlist',
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
