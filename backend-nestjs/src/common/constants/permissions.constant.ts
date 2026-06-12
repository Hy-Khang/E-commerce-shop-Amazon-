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
  // Dashboard
  DASHBOARD_READ: 'dashboard:read',
  // Portal Access
  PORTAL_ADMIN: 'portal:admin',
  PORTAL_SELLER: 'portal:seller',
  PORTAL_SHIPPER: 'portal:shipper',
} as const;

export type PermissionString = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const ALL_PERMISSIONS: PermissionString[] = Object.values(PERMISSIONS);
