export const ROUTES = {
  HOME: '/',
  PRODUCTS: '/products',
  PRODUCT_DETAIL: (slug: string) => `/products/${slug}`,
  CATEGORY: (slug: string) => `/categories/${slug}`,
  SHOP_PROFILE: (slug: string) => `/shops/${slug}`,
  FLASH_SALE: '/flash-sale',

  LOGIN: '/login',
  REGISTER: '/register',
  VERIFY_EMAIL: '/verify-email',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  OAUTH_CALLBACK: '/oauth/callback',

  CART: '/cart',
  CHECKOUT: '/checkout',
  PAYMENT_RESULT: '/checkout/payment-result',

  ORDERS: '/orders',
  ORDER_DETAIL: (id: number) => `/orders/${id}`,

  PROFILE: '/profile',
  ADDRESSES: '/profile/addresses',
  MY_REVIEWS: '/profile/reviews',
  WALLET: '/wallet',
  WISHLIST: '/wishlist',
  NOTIFICATIONS: '/notifications',
  CHAT: '/chat',
  CHAT_CONVERSATION: (id: number) => `/chat/${id}`,

  ADMIN_DASHBOARD: '/admin/dashboard',
  ADMIN_PRODUCTS: '/admin/products',
  ADMIN_PRODUCT_CREATE: '/admin/products/new',
  ADMIN_PRODUCT_DETAIL: (id: number) => `/admin/products/${id}`,
  ADMIN_PRODUCT_EDIT: (id: number) => `/admin/products/${id}/edit`,
  ADMIN_ORDERS: '/admin/orders',
  ADMIN_ORDER_DETAIL: (id: number) => `/admin/orders/${id}`,
  ADMIN_ROLES: '/admin/roles',
  ADMIN_PERMISSIONS: '/admin/permissions',
  ADMIN_USERS: '/admin/users',
  ADMIN_USER_DETAIL: (id: number) => `/admin/users/${id}`,
  ADMIN_CATEGORIES: '/admin/categories',
  ADMIN_REVIEWS: '/admin/reviews',
  ADMIN_WISHLIST: '/admin/wishlist',
  ADMIN_SHOPS: '/admin/shops',
  ADMIN_SHOP_DETAIL: (id: number) => `/admin/shops/${id}`,
  ADMIN_NOTIFICATIONS: '/admin/notifications',
  ADMIN_COUPONS: '/admin/coupons',
  ADMIN_FLASH_SALES: '/admin/flash-sales',
  ADMIN_COIN_SETTINGS: '/admin/settings/coins',
  ADMIN_AI_CONVERSATIONS: '/admin/ai-conversations',
  ADMIN_AI_CONVERSATION_DETAIL: (id: number) => `/admin/ai-conversations/${id}`,
  ADMIN_AI_SETTINGS: '/admin/ai-settings',

  SELLER_DASHBOARD: '/seller/dashboard',
  SELLER_PRODUCTS: '/seller/products',
  SELLER_PRODUCT_CREATE: '/seller/products/new',
  SELLER_PRODUCT_EDIT: (id: number) => `/seller/products/${id}/edit`,
  SELLER_NOTIFICATIONS: '/seller/notifications',
  SELLER_ORDERS: '/seller/orders',
  SELLER_ORDER_DETAIL: (id: number) => `/seller/orders/${id}`,
  SELLER_SHOP: '/seller/shop',
  SELLER_CHAT: '/seller/chat',
  SELLER_COUPONS: '/seller/coupons',
  SELLER_FLASH_SALES: '/seller/flash-sales',
  SELLER_REVIEWS: '/seller/reviews',
  SELLER_WISHLIST: '/seller/wishlist',

  SHIPPER_DASHBOARD: '/shipper/dashboard',
  SHIPPER_DELIVERIES: '/shipper/deliveries',
  SHIPPER_DELIVERY_DETAIL: (id: number) => `/shipper/deliveries/${id}`,
  SHIPPER_NOTIFICATIONS: '/shipper/notifications',
} as const;

export const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  shipping: 'Shipping',
  delivered: 'Delivered',
  completed: 'Completed',
  return_requested: 'Return Requested',
  cancelled: 'Cancelled',
};

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  unpaid: 'Unpaid',
  paid: 'Paid',
};

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cod: 'Cash on Delivery',
  vnpay: 'VNPay',
  momo: 'MoMo',
};

export const TRANSACTION_STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  completed: 'Completed',
  failed: 'Failed',
  refunded: 'Refunded',
};
