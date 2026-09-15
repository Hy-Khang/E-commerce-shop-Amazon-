import * as bcrypt from 'bcrypt';
import { DataSource } from 'typeorm';
import { ISeed } from './seed.interface';

const SALT_ROUNDS = 10;

const SELLER_PERMISSIONS = [
  'products:create',
  'products:read',
  'products:update',
  'products:delete',
  'categories:read',
  'orders:read',
  'orders:update',
  'coupons:create',
  'coupons:read',
  'coupons:update',
  'coupons:delete',
  'reviews:read',
  'wishlist:read',
  'uploads:create',
  'dashboard:read',
  'shops:create',
  'shops:read',
  'shops:update',
  'flash_registrations:create',
  'flash_registrations:read',
  'flash_registrations:update',
  'flash_registrations:delete',
  'wallet:read',
  'withdrawals:create',
  'portal:seller',
];

const SHIPPER_PERMISSIONS = [
  'orders:read',
  'orders:update',
  'dashboard:read',
  'portal:shipper',
];

const SEED_PERMISSIONS = [
  { resource: 'products', action: 'create', name: 'Create Product' },
  { resource: 'products', action: 'read', name: 'Read Products' },
  { resource: 'products', action: 'update', name: 'Update Product' },
  { resource: 'products', action: 'delete', name: 'Delete Product' },
  { resource: 'categories', action: 'create', name: 'Create Category' },
  { resource: 'categories', action: 'read', name: 'Read Categories' },
  { resource: 'categories', action: 'update', name: 'Update Category' },
  { resource: 'categories', action: 'delete', name: 'Delete Category' },
  { resource: 'orders', action: 'read', name: 'Read Orders' },
  { resource: 'orders', action: 'update', name: 'Update Order' },
  { resource: 'users', action: 'read', name: 'Read Users' },
  { resource: 'users', action: 'update', name: 'Update User' },
  { resource: 'roles', action: 'create', name: 'Create Role' },
  { resource: 'roles', action: 'read', name: 'Read Roles' },
  { resource: 'roles', action: 'update', name: 'Update Role' },
  { resource: 'roles', action: 'delete', name: 'Delete Role' },
  { resource: 'permissions', action: 'create', name: 'Create Permission' },
  { resource: 'permissions', action: 'read', name: 'Read Permissions' },
  { resource: 'permissions', action: 'update', name: 'Update Permission' },
  { resource: 'permissions', action: 'delete', name: 'Delete Permission' },
  { resource: 'reviews', action: 'read', name: 'Read Reviews' },
  { resource: 'reviews', action: 'delete', name: 'Delete Review' },
  { resource: 'coupons', action: 'create', name: 'Create Coupon' },
  { resource: 'coupons', action: 'read', name: 'Read Coupons' },
  { resource: 'coupons', action: 'update', name: 'Update Coupon' },
  { resource: 'coupons', action: 'delete', name: 'Delete Coupon' },
  { resource: 'wishlist', action: 'read', name: 'Read Wishlist Analytics' },
  { resource: 'uploads', action: 'create', name: 'Upload Files' },
  { resource: 'payments', action: 'create', name: 'Create Payment' },
  { resource: 'payments', action: 'read', name: 'Read Payments' },
  { resource: 'flash_sales', action: 'create', name: 'Create Flash Sale' },
  { resource: 'flash_sales', action: 'read', name: 'Read Flash Sales' },
  { resource: 'flash_sales', action: 'update', name: 'Update Flash Sale' },
  { resource: 'flash_sales', action: 'delete', name: 'Delete Flash Sale' },
  {
    resource: 'flash_registrations',
    action: 'create',
    name: 'Register Flash Sale Product',
  },
  {
    resource: 'flash_registrations',
    action: 'read',
    name: 'Read Flash Sale Registrations',
  },
  {
    resource: 'flash_registrations',
    action: 'update',
    name: 'Update Flash Sale Registration',
  },
  {
    resource: 'flash_registrations',
    action: 'delete',
    name: 'Withdraw Flash Sale Registration',
  },
  { resource: 'settings', action: 'read', name: 'Read Settings' },
  { resource: 'settings', action: 'update', name: 'Update Settings' },
  {
    resource: 'seller_applications',
    action: 'read',
    name: 'Read Seller Applications',
  },
  {
    resource: 'seller_applications',
    action: 'update',
    name: 'Review Seller Applications',
  },
  { resource: 'wallet', action: 'read', name: 'Read Seller Wallet' },
  { resource: 'withdrawals', action: 'create', name: 'Create Withdrawal' },
  { resource: 'withdrawals', action: 'read', name: 'Read Withdrawals' },
  { resource: 'withdrawals', action: 'update', name: 'Review Withdrawals' },
  { resource: 'ai_chatbox', action: 'read', name: 'Read AI Chatbox' },
  { resource: 'ai_chatbox', action: 'update', name: 'Update AI Chatbox' },
  { resource: 'dashboard', action: 'read', name: 'Read Dashboard' },
  { resource: 'shops', action: 'create', name: 'Create Shop' },
  { resource: 'shops', action: 'read', name: 'Read Shops' },
  { resource: 'shops', action: 'update', name: 'Update Shop' },
  { resource: 'portal', action: 'admin', name: 'Access Admin Portal' },
  { resource: 'portal', action: 'seller', name: 'Access Seller Portal' },
  { resource: 'portal', action: 'shipper', name: 'Access Shipper Portal' },
];

export const AuthSeed: ISeed = {
  name: 'auth',
  order: 1,
  tables: ['users', 'roles', 'permissions', 'role_permissions'],

  async run(ds: DataSource) {
    const qr = ds.createQueryRunner();

    await qr.query(`
      INSERT INTO roles (id, name, is_system) VALUES
        (1, 'customer', true),
        (2, 'admin', true),
        (3, 'seller', true),
        (4, 'shipper', true);
    `);
    console.log('  + roles: 4 rows');

    const hash = bcrypt.hashSync('123456789', SALT_ROUNDS);

    await qr.query(`
      INSERT INTO users (id, role_id, email, password_hash, full_name, phone, is_active, email_verified) VALUES
        -- Admin
        (1,  2, 'admin@example.com',      '${hash}', 'Admin',              '0901000000', true, true),
        -- Customers (2-8)
        (2,  1, 'customer1@example.com',   '${hash}', 'Nguyễn Văn An',      '0901000001', true, true),
        (3,  1, 'customer2@example.com',   '${hash}', 'Trần Thị Bình',      '0901000002', true, true),
        (4,  1, 'customer3@example.com',   '${hash}', 'Lê Hoàng Cường',     '0901000003', true, true),
        (5,  1, 'customer4@example.com',   '${hash}', 'Phạm Minh Đức',      '0901000004', true, true),
        (6,  1, 'customer5@example.com',   '${hash}', 'Hoàng Thị Nga',      '0901000005', true, true),
        (7,  1, 'customer6@example.com',   '${hash}', 'Đỗ Văn Khoa',        '0901000006', true, true),
        (8,  1, 'customer7@example.com',   '${hash}', 'Bùi Minh Tâm',       '0901000007', true, true),
        -- Sellers (9-15)
        (9,  3, 'seller1@example.com',     '${hash}', 'Nguyễn Thị Hằng',    '0901000008', true, true),
        (10, 3, 'seller2@example.com',     '${hash}', 'Trần Minh Tuấn',     '0901000009', true, true),
        (11, 3, 'seller3@example.com',     '${hash}', 'Lê Thị Mai',         '0901000010', true, true),
        (12, 3, 'seller4@example.com',     '${hash}', 'Phạm Quốc Bảo',     '0901000011', true, true),
        (13, 3, 'seller5@example.com',     '${hash}', 'Võ Thanh Hùng',      '0901000012', true, true),
        (14, 3, 'seller6@example.com',     '${hash}', 'Đặng Thị Lan',       '0901000013', true, true),
        (15, 3, 'seller7@example.com',     '${hash}', 'Ngô Thanh Sơn',      '0901000014', true, true),
        -- Shipper (16)
        (16, 4, 'shipper@example.com',     '${hash}', 'Trần Văn Giang',     '0901000015', true, true);
    `);
    console.log('  + users: 16 rows');

    const permissionValues = SEED_PERMISSIONS.map(
      (p) => `('${p.name}', '${p.resource}', '${p.action}')`,
    ).join(',\n        ');

    await qr.query(`
      INSERT INTO permissions (name, resource, action) VALUES
        ${permissionValues};
    `);
    console.log(`  + permissions: ${SEED_PERMISSIONS.length} rows`);

    await qr.query(`
      INSERT INTO role_permissions (role_id, permission_id)
      SELECT 2, id FROM permissions;
    `);
    console.log(
      `  + role_permissions: ${SEED_PERMISSIONS.length} rows (admin gets all)`,
    );

    const sellerWhere = SELLER_PERMISSIONS.map((p) => {
      const [resource, action] = p.split(':');
      return `(resource = '${resource}' AND action = '${action}')`;
    }).join(' OR ');
    await qr.query(`
      INSERT INTO role_permissions (role_id, permission_id)
      SELECT 3, id FROM permissions WHERE ${sellerWhere};
    `);
    console.log(
      `  + role_permissions: ${SELLER_PERMISSIONS.length} rows (seller)`,
    );

    const shipperWhere = SHIPPER_PERMISSIONS.map((p) => {
      const [resource, action] = p.split(':');
      return `(resource = '${resource}' AND action = '${action}')`;
    }).join(' OR ');
    await qr.query(`
      INSERT INTO role_permissions (role_id, permission_id)
      SELECT 4, id FROM permissions WHERE ${shipperWhere};
    `);
    console.log(
      `  + role_permissions: ${SHIPPER_PERMISSIONS.length} rows (shipper)`,
    );

    await qr.release();
  },
};
