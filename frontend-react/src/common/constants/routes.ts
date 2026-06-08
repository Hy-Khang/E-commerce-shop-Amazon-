export const ROUTES = {
  HOME: '/',
  PRODUCTS: '/products',
  PRODUCT_DETAIL: (slug: string) => `/products/${slug}`,
  CATEGORY: (slug: string) => `/categories/${slug}`,
  SHOP_PROFILE: (slug: string) => `/shops/${slug}`,

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

  ADMIN_DASHBOARD: '/admin/dashboard',
  ADMIN_PRODUCTS: '/admin/products',
  ADMIN_PRODUCT_CREATE: '/admin/products/new',
  ADMIN_PRODUCT_EDIT: (id: number) => `/admin/products/${id}/edit`,
  ADMIN_ORDERS: '/admin/orders',
  ADMIN_ORDER_DETAIL: (id: number) => `/admin/orders/${id}`,
  ADMIN_ROLES: '/admin/roles',
  ADMIN_PERMISSIONS: '/admin/permissions',
  ADMIN_USERS: '/admin/users',
  ADMIN_USER_DETAIL: (id: number) => `/admin/users/${id}`,
  ADMIN_CATEGORIES: '/admin/categories',
  ADMIN_CATEGORY_CREATE: '/admin/categories/new',
  ADMIN_CATEGORY_EDIT: (id: number) => `/admin/categories/${id}/edit`,
  ADMIN_REVIEWS: '/admin/reviews',
  ADMIN_WISHLIST: '/admin/wishlist',
  ADMIN_SHOPS: '/admin/shops',
  ADMIN_SHOP_DETAIL: (id: number) => `/admin/shops/${id}`,
  ADMIN_COUPONS: '/admin/coupons',
  ADMIN_COUPON_CREATE: '/admin/coupons/new',
  ADMIN_COUPON_EDIT: (id: number) => `/admin/coupons/${id}/edit`,

  SELLER_DASHBOARD: '/seller/dashboard',
  SELLER_PRODUCTS: '/seller/products',
  SELLER_PRODUCT_CREATE: '/seller/products/new',
  SELLER_PRODUCT_EDIT: (id: number) => `/seller/products/${id}/edit`,
  SELLER_ORDERS: '/seller/orders',
  SELLER_ORDER_DETAIL: (id: number) => `/seller/orders/${id}`,
  SELLER_SHOP: '/seller/shop',

  SHIPPER_DASHBOARD: '/shipper/dashboard',
  SHIPPER_DELIVERIES: '/shipper/deliveries',
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
