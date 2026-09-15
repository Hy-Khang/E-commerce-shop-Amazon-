export const PERMISSIONS = {
  // Products
  PRODUCTS_CREATE: 'products:create',
  PRODUCTS_READ: 'products:read',
  PRODUCTS_UPDATE: 'products:update',
  PRODUCTS_DELETE: 'products:delete',
  // Categories
  CATEGORIES_CREATE: 'categories:create',
  CATEGORIES_READ: 'categories:read',
  CATEGORIES_UPDATE: 'categories:update',
  CATEGORIES_DELETE: 'categories:delete',
  // Orders
  ORDERS_READ: 'orders:read',
  ORDERS_UPDATE: 'orders:update',
  // Users
  USERS_READ: 'users:read',
  USERS_UPDATE: 'users:update',
  // Roles
  ROLES_CREATE: 'roles:create',
  ROLES_READ: 'roles:read',
  ROLES_UPDATE: 'roles:update',
  ROLES_DELETE: 'roles:delete',
  // Permissions
  PERMISSIONS_CREATE: 'permissions:create',
  PERMISSIONS_READ: 'permissions:read',
  PERMISSIONS_UPDATE: 'permissions:update',
  PERMISSIONS_DELETE: 'permissions:delete',
  // Reviews
  REVIEWS_READ: 'reviews:read',
  REVIEWS_DELETE: 'reviews:delete',
  // Coupons
  COUPONS_CREATE: 'coupons:create',
  COUPONS_READ: 'coupons:read',
  COUPONS_UPDATE: 'coupons:update',
  COUPONS_DELETE: 'coupons:delete',
  // Wishlist
  WISHLIST_READ: 'wishlist:read',
  // Uploads
  UPLOADS_CREATE: 'uploads:create',
  // Shops
  SHOPS_CREATE: 'shops:create',
  SHOPS_READ: 'shops:read',
  SHOPS_UPDATE: 'shops:update',
  // Payments
  PAYMENTS_CREATE: 'payments:create',
  PAYMENTS_READ: 'payments:read',
  // Flash Sales (admin-only: campaign management + registration moderation)
  FLASH_SALES_CREATE: 'flash_sales:create',
  FLASH_SALES_READ: 'flash_sales:read',
  FLASH_SALES_UPDATE: 'flash_sales:update',
  FLASH_SALES_DELETE: 'flash_sales:delete',
  // Flash Sale Registrations (seller-only: register own products into campaigns)
  FLASH_REGISTRATIONS_CREATE: 'flash_registrations:create',
  FLASH_REGISTRATIONS_READ: 'flash_registrations:read',
  FLASH_REGISTRATIONS_UPDATE: 'flash_registrations:update',
  FLASH_REGISTRATIONS_DELETE: 'flash_registrations:delete',
  // Settings (admin-only: runtime app config, e.g. coin/Hoàn Xu, commission)
  SETTINGS_READ: 'settings:read',
  SETTINGS_UPDATE: 'settings:update',
  // Seller Applications (admin-only: onboarding moderation queue)
  SELLER_APPLICATIONS_READ: 'seller_applications:read',
  SELLER_APPLICATIONS_UPDATE: 'seller_applications:update',
  // Seller Wallet (seller-only: read own wallet + ledger)
  WALLET_READ: 'wallet:read',
  // Withdrawals (seller creates own; admin moderates the payout queue)
  WITHDRAWALS_CREATE: 'withdrawals:create',
  WITHDRAWALS_READ: 'withdrawals:read',
  WITHDRAWALS_UPDATE: 'withdrawals:update',
  // AI Chatbox (admin-only: view conversation history + toggle/settings)
  AI_CHATBOX_READ: 'ai_chatbox:read',
  AI_CHATBOX_UPDATE: 'ai_chatbox:update',
  // Dashboard
  DASHBOARD_READ: 'dashboard:read',
  // Portal Access
  PORTAL_ADMIN: 'portal:admin',
  PORTAL_SELLER: 'portal:seller',
  PORTAL_SHIPPER: 'portal:shipper',
} as const;

export type PermissionString = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const ALL_PERMISSIONS: PermissionString[] = Object.values(PERMISSIONS);
