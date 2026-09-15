import { DataSource } from 'typeorm';
import { ISeed } from './seed.interface';

export const UserProfileSeed: ISeed = {
  name: 'user-profile',
  order: 2,
  tables: ['addresses'],

  async run(ds: DataSource) {
    const qr = ds.createQueryRunner();

    await qr.query(`
      INSERT INTO addresses (id, user_id, full_name, phone, address_line, city, is_default, latitude, longitude) VALUES
        (1, 2,  'Nguyễn Văn An',    '0901000001', '123 Lê Lợi, Quận 1',           'Hồ Chí Minh', true, 10.7726, 106.6981),
        (2, 2,  'Nguyễn Văn An',    '0901000001', '456 Nguyễn Huệ, Quận 1',       'Hồ Chí Minh', false, 10.7741, 106.7011),
        (3, 3,  'Trần Thị Bình',    '0901000002', '789 Trần Hưng Đạo, Quận 5',    'Hồ Chí Minh', true, 10.7548, 106.6632),
        (4, 4,  'Lê Hoàng Cường',   '0901000003', '12 Hoàng Diệu, Hải Châu',      'Đà Nẵng', true, 16.0678, 108.2208),
        (5, 5,  'Phạm Minh Đức',    '0901000004', '34 Tràng Tiền, Hoàn Kiếm',     'Hà Nội', true, 21.0245, 105.8568),
        (6, 6,  'Hoàng Thị Nga',    '0901000005', '56 Bà Triệu, Hai Bà Trưng',    'Hà Nội', true, 21.0115, 105.8505),
        (7, 7,  'Đỗ Văn Khoa',      '0901000006', '78 Hùng Vương, Thanh Khê',     'Đà Nẵng', true, 16.0680, 108.2060),
        (8, 8,  'Bùi Minh Tâm',     '0901000007', '90 Nguyễn Trãi, Quận 5',       'Hồ Chí Minh', true, 10.7540, 106.6614);
    `);
    console.log('  + addresses: 8 rows');

    await qr.release();
  },
};
