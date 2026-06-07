import { DataSource } from 'typeorm';
import { ISeed } from './seed.interface';

export const ShopSeed: ISeed = {
  name: 'shop',
  order: 2.5,
  tables: ['shops'],

  async run(ds: DataSource) {
    const qr = ds.createQueryRunner();

    await qr.query(`
      SET IDENTITY_INSERT shops ON;
      INSERT INTO shops (id, user_id, name, slug, description, logo_url, banner_url, status, verified_at) VALUES
        (1, 6, N'Shop Thời Trang Hằng', N'shop-thoi-trang-hang', N'Chuyên thời trang nam nữ chất lượng cao, giá tốt nhất thị trường', N'https://picsum.photos/seed/shop-hang-logo/200/200', N'https://picsum.photos/seed/shop-hang-banner/1200/300', N'active', SYSUTCDATETIME());
      SET IDENTITY_INSERT shops OFF;
    `);
    console.log('  + shops: 1 row');

    await qr.release();
  },
};
