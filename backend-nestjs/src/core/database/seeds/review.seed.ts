import { DataSource } from 'typeorm';
import { ISeed } from './seed.interface';

export const ReviewSeed: ISeed = {
  name: 'review',
  order: 5,
  tables: ['reviews'],

  async run(ds: DataSource) {
    const qr = ds.createQueryRunner();

    // Only reviews for delivered orders (order 1: products 1,7; order 2: product 8)
    await qr.query(`
      SET IDENTITY_INSERT reviews ON;
      INSERT INTO reviews (id, user_id, product_id, order_id, rating, comment) VALUES
        (1, 2, 1, 1, 5, N'Áo mặc rất thoáng mát, chất cotton mềm. Sẽ mua thêm màu khác.'),
        (2, 2, 7, 1, 4, N'Dép êm chân, đi thoải mái. Giao hàng nhanh.'),
        (3, 2, 8, 2, 5, N'iPhone xịn quá, camera chụp đẹp, pin trâu. Worth every đồng!');
      SET IDENTITY_INSERT reviews OFF;
    `);
    console.log('  + reviews: 3 rows');

    await qr.release();
  },
};
