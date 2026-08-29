import * as bcrypt from 'bcrypt';
import { DataSource } from 'typeorm';
import { ISeed } from './seed.interface';

const SALT_ROUNDS = 10;

const SELLER_PERMISSIONS = [
  'products:create', 'products:read', 'products:update', 'products:delete',
  'categories:read',
  'orders:read', 'orders:update',
  'coupons:create', 'coupons:read', 'coupons:update', 'coupons:delete',
  'reviews:read',
  'wishlist:read',
  'uploads:create',
  'dashboard:read',
  'shops:create', 'shops:read', 'shops:update',
  'flash_registrations:create', 'flash_registrations:read', 'flash_registrations:update', 'flash_registrations:delete',
  'portal:seller',
];

const SHIPPER_PERMISSIONS = [
  'orders:read', 'orders:update',
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
  { resource: 'flash_registrations', action: 'create', name: 'Register Flash Sale Product' },
  { resource: 'flash_registrations', action: 'read', name: 'Read Flash Sale Registrations' },
  { resource: 'flash_registrations', action: 'update', name: 'Update Flash Sale Registration' },
  { resource: 'flash_registrations', action: 'delete', name: 'Withdraw Flash Sale Registration' },
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
      SET IDENTITY_INSERT roles ON;
      INSERT INTO roles (id, name, is_system) VALUES
        (1, N'customer', 1),
        (2, N'admin', 1),
        (3, N'seller', 1),
        (4, N'shipper', 1);
      SET IDENTITY_INSERT roles OFF;
    `);
    console.log('  + roles: 4 rows');

    const hash = bcrypt.hashSync('123456789', SALT_ROUNDS);

    await qr.query(`
      SET IDENTITY_INSERT users ON;
      INSERT INTO users (id, role_id, email, password_hash, full_name, phone, is_active, email_verified) VALUES
        -- Admin
        (1,  2, N'admin@example.com',      N'${hash}', N'Admin',              N'0901000000', 1, 1),
        -- Customers (2-8)
        (2,  1, N'customer1@example.com',   N'${hash}', N'Nguyễn Văn An',      N'0901000001', 1, 1),
        (3,  1, N'customer2@example.com',   N'${hash}', N'Trần Thị Bình',      N'0901000002', 1, 1),
        (4,  1, N'customer3@example.com',   N'${hash}', N'Lê Hoàng Cường',     N'0901000003', 1, 1),
        (5,  1, N'customer4@example.com',   N'${hash}', N'Phạm Minh Đức',      N'0901000004', 1, 1),
        (6,  1, N'customer5@example.com',   N'${hash}', N'Hoàng Thị Nga',      N'0901000005', 1, 1),
        (7,  1, N'customer6@example.com',   N'${hash}', N'Đỗ Văn Khoa',        N'0901000006', 1, 1),
        (8,  1, N'customer7@example.com',   N'${hash}', N'Bùi Minh Tâm',       N'0901000007', 1, 1),
        -- Sellers (9-15)
        (9,  3, N'seller1@example.com',     N'${hash}', N'Nguyễn Thị Hằng',    N'0901000008', 1, 1),
        (10, 3, N'seller2@example.com',     N'${hash}', N'Trần Minh Tuấn',     N'0901000009', 1, 1),
        (11, 3, N'seller3@example.com',     N'${hash}', N'Lê Thị Mai',         N'0901000010', 1, 1),
        (12, 3, N'seller4@example.com',     N'${hash}', N'Phạm Quốc Bảo',     N'0901000011', 1, 1),
        (13, 3, N'seller5@example.com',     N'${hash}', N'Võ Thanh Hùng',      N'0901000012', 1, 1),
        (14, 3, N'seller6@example.com',     N'${hash}', N'Đặng Thị Lan',       N'0901000013', 1, 1),
        (15, 3, N'seller7@example.com',     N'${hash}', N'Ngô Thanh Sơn',      N'0901000014', 1, 1),
        -- Shipper (16)
        (16, 4, N'shipper@example.com',     N'${hash}', N'Trần Văn Giang',     N'0901000015', 1, 1);
      SET IDENTITY_INSERT users OFF;
    `);
    console.log('  + users: 16 rows');

    const permissionValues = SEED_PERMISSIONS.map(
      (p) => `(N'${p.name}', N'${p.resource}', N'${p.action}')`,
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
    console.log(`  + role_permissions: ${SEED_PERMISSIONS.length} rows (admin gets all)`);

    const sellerWhere = SELLER_PERMISSIONS.map(
      (p) => {
        const [resource, action] = p.split(':');
        return `(resource = N'${resource}' AND action = N'${action}')`;
      },
    ).join(' OR ');
    await qr.query(`
      INSERT INTO role_permissions (role_id, permission_id)
      SELECT 3, id FROM permissions WHERE ${sellerWhere};
    `);
    console.log(`  + role_permissions: ${SELLER_PERMISSIONS.length} rows (seller)`);

    const shipperWhere = SHIPPER_PERMISSIONS.map(
      (p) => {
        const [resource, action] = p.split(':');
        return `(resource = N'${resource}' AND action = N'${action}')`;
      },
    ).join(' OR ');
    await qr.query(`
      INSERT INTO role_permissions (role_id, permission_id)
      SELECT 4, id FROM permissions WHERE ${shipperWhere};
    `);
    console.log(`  + role_permissions: ${SHIPPER_PERMISSIONS.length} rows (shipper)`);

    await qr.release();
  },
};
