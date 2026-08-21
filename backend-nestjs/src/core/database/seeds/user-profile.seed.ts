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
      INSERT INTO addresses (id, user_id, full_name, phone, address_line, city, is_default, latitude, longitude) VALUES
        (1, 2,  N'Nguyễn Văn An',    N'0901000001', N'123 Lê Lợi, Quận 1',           N'Hồ Chí Minh',  1, 10.7726, 106.6981),
        (2, 2,  N'Nguyễn Văn An',    N'0901000001', N'456 Nguyễn Huệ, Quận 1',       N'Hồ Chí Minh',  0, 10.7741, 106.7011),
        (3, 3,  N'Trần Thị Bình',    N'0901000002', N'789 Trần Hưng Đạo, Quận 5',    N'Hồ Chí Minh',  1, 10.7548, 106.6632),
        (4, 4,  N'Lê Hoàng Cường',   N'0901000003', N'12 Hoàng Diệu, Hải Châu',      N'Đà Nẵng',      1, 16.0678, 108.2208),
        (5, 5,  N'Phạm Minh Đức',    N'0901000004', N'34 Tràng Tiền, Hoàn Kiếm',     N'Hà Nội',       1, 21.0245, 105.8568),
        (6, 6,  N'Hoàng Thị Nga',    N'0901000005', N'56 Bà Triệu, Hai Bà Trưng',    N'Hà Nội',       1, 21.0115, 105.8505),
        (7, 7,  N'Đỗ Văn Khoa',      N'0901000006', N'78 Hùng Vương, Thanh Khê',     N'Đà Nẵng',      1, 16.0680, 108.2060),
        (8, 8,  N'Bùi Minh Tâm',     N'0901000007', N'90 Nguyễn Trãi, Quận 5',       N'Hồ Chí Minh',  1, 10.7540, 106.6614);
      SET IDENTITY_INSERT addresses OFF;
    `);
    console.log('  + addresses: 8 rows');

    await qr.release();
  },
};
