import * as bcrypt from 'bcrypt';
import { DataSource } from 'typeorm';
import { ISeed } from './seed.interface';

const SALT_ROUNDS = 10;

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
  { resource: 'dashboard', action: 'read', name: 'Read Dashboard' },
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
        (2, N'admin', 1);
      SET IDENTITY_INSERT roles OFF;
    `);
    console.log('  + roles: 2 rows');

    const adminHash = bcrypt.hashSync('Admin@123', SALT_ROUNDS);
    const customerHash = bcrypt.hashSync('Customer@123', SALT_ROUNDS);

    await qr.query(`
      SET IDENTITY_INSERT users ON;
      INSERT INTO users (id, role_id, email, password_hash, full_name, phone, is_active) VALUES
        (1, 2, N'admin@example.com',     N'${adminHash}',    N'Admin',              N'0901000000', 1),
        (2, 1, N'customer1@example.com',  N'${customerHash}', N'Nguyễn Văn An',      N'0901000001', 1),
        (3, 1, N'customer2@example.com',  N'${customerHash}', N'Trần Thị Bình',      N'0901000002', 1),
        (4, 1, N'customer3@example.com',  N'${customerHash}', N'Lê Hoàng Cường',     N'0901000003', 1),
        (5, 1, N'customer4@example.com',  N'${customerHash}', N'Phạm Minh Đức',      N'0901000004', 1);
      SET IDENTITY_INSERT users OFF;
    `);
    console.log('  + users: 5 rows');

    // Seed permissions
    const permissionValues = SEED_PERMISSIONS.map(
      (p) => `(N'${p.name}', N'${p.resource}', N'${p.action}')`,
    ).join(',\n        ');

    await qr.query(`
      INSERT INTO permissions (name, resource, action) VALUES
        ${permissionValues};
    `);
    console.log(`  + permissions: ${SEED_PERMISSIONS.length} rows`);

    // Assign all permissions to admin role (id=2)
    await qr.query(`
      INSERT INTO role_permissions (role_id, permission_id)
      SELECT 2, id FROM permissions;
    `);
    const adminPermCount = SEED_PERMISSIONS.length;
    console.log(`  + role_permissions: ${adminPermCount} rows (admin gets all)`);

    await qr.release();
  },
};
