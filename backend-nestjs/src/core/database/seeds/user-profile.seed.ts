import { DataSource } from 'typeorm';
import { ISeed } from './seed.interface';

export const UserProfileSeed: ISeed = {
  name: 'user-profile',
  order: 2,
  tables: ['addresses'],

  async run(ds: DataSource) {
    const qr = ds.createQueryRunner();

    await qr.query(`
      SET IDENTITY_INSERT addresses ON;
      INSERT INTO addresses (id, user_id, full_name, phone, address_line, city, is_default) VALUES
        (1, 2,  N'Nguyễn Văn An',    N'0901000001', N'123 Lê Lợi, Quận 1',           N'Hồ Chí Minh',  1),
        (2, 2,  N'Nguyễn Văn An',    N'0901000001', N'456 Nguyễn Huệ, Quận 1',       N'Hồ Chí Minh',  0),
        (3, 3,  N'Trần Thị Bình',    N'0901000002', N'789 Trần Hưng Đạo, Quận 5',    N'Hồ Chí Minh',  1),
        (4, 4,  N'Lê Hoàng Cường',   N'0901000003', N'12 Hoàng Diệu, Hải Châu',      N'Đà Nẵng',      1),
        (5, 5,  N'Phạm Minh Đức',    N'0901000004', N'34 Tràng Tiền, Hoàn Kiếm',     N'Hà Nội',       1),
        (6, 14, N'Hoàng Thị Nga',    N'0901000013', N'56 Bà Triệu, Hai Bà Trưng',    N'Hà Nội',       1),
        (7, 15, N'Đỗ Văn Khoa',      N'0901000014', N'78 Hùng Vương, Thanh Khê',     N'Đà Nẵng',      1),
        (8, 16, N'Bùi Minh Tâm',     N'0901000015', N'90 Nguyễn Trãi, Quận 5',       N'Hồ Chí Minh',  1);
      SET IDENTITY_INSERT addresses OFF;
    `);
    console.log('  + addresses: 8 rows');

    await qr.release();
  },
};
