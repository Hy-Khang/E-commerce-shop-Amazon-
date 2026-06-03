import * as bcrypt from 'bcrypt';
import { DataSource } from 'typeorm';
import { ISeed } from './seed.interface';

const SALT_ROUNDS = 10;

export const AuthSeed: ISeed = {
  name: 'auth',
  order: 1,
  tables: ['users', 'roles'],

  async run(ds: DataSource) {
    const qr = ds.createQueryRunner();

    await qr.query(`
      SET IDENTITY_INSERT roles ON;
      INSERT INTO roles (id, name) VALUES
        (1, N'customer'),
        (2, N'admin');
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

    await qr.release();
  },
};
