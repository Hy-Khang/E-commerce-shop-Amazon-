import { DataSource } from 'typeorm';
import { ISeed } from './seed.interface';

export const ReviewSeed: ISeed = {
  name: 'review',
  order: 5,
  tables: ['reviews'],

  async run(ds: DataSource) {
    const qr = ds.createQueryRunner();

    // Reviews for delivered orders only — not every order gets reviewed
    await qr.query(`
      SET IDENTITY_INSERT reviews ON;
      INSERT INTO reviews (id, user_id, product_id, order_id, rating, comment, created_at) VALUES
        -- Order 1 (March 5, user 2, delivered): products 1, 7
        (1,  2,  1,  1,  5, N'Áo mặc rất thoáng mát, chất cotton mềm. Sẽ mua thêm màu khác.',              '2026-03-10T08:30:00'),
        (2,  2,  7,  1,  4, N'Dép êm chân, đi thoải mái. Giao hàng nhanh.',                                 '2026-03-10T08:35:00'),
        -- Order 2 (March 8, user 3, delivered): product 8
        (3,  3,  8,  2,  5, N'iPhone xịn quá, camera chụp đẹp, pin trâu. Worth every đồng!',                '2026-03-15T19:00:00'),
        -- Order 3 (March 12, user 4, delivered): products 18, 19
        (4,  4,  18, 3,  4, N'Sách hay, nội dung dễ hiểu. Giao hàng đóng gói cẩn thận.',                    '2026-03-18T20:15:00'),
        (5,  4,  19, 3,  5, N'Cuốn sách thay đổi cuộc đời mình. Highly recommended!',                       '2026-03-18T20:20:00'),
        -- Order 5 (March 20, user 2, delivered): products 12, 13
        (6,  2,  12, 5,  5, N'AirPods chống ồn rất tốt, kết nối nhanh với iPhone.',                         '2026-03-26T10:00:00'),
        (7,  2,  13, 5,  4, N'Sạc nhanh thật sự, 3 cổng tiện lợi. Hơi nóng khi sạc lâu.',                  '2026-03-26T10:05:00'),
        -- Order 6 (March 25, user 14, delivered): products 2, 6
        (8,  14, 2,  6,  4, N'Áo oversize form đẹp, vải mềm. Size hơi rộng so với mô tả.',                  '2026-04-01T14:30:00'),
        (9,  14, 6,  6,  5, N'Giày sneaker đi rất êm, màu trắng dễ phối đồ.',                               '2026-04-01T14:35:00'),
        -- Order 7 (March 30, user 15, delivered): product 9
        (10, 15, 9,  7,  5, N'Samsung camera zoom 100x quá đỉnh. Màn hình sáng đẹp.',                       '2026-04-05T11:20:00'),
        -- Order 8 (April 3, user 16, delivered): product 15
        (11, 16, 15, 8,  4, N'Ghế ngồi thoải mái, tựa đầu điều chỉnh được. Lắp ráp hơi khó.',              '2026-04-10T09:45:00'),
        -- Order 9 (April 8, user 3, delivered): product 6
        (12, 3,  6,  9,  3, N'Giày đẹp nhưng đế hơi cứng, cần thời gian để mềm.',                          '2026-04-14T16:00:00'),
        -- Order 10 (April 12, user 4, delivered): product 10
        (13, 4,  10, 10, 5, N'MacBook M3 chạy mượt, pin dùng cả ngày. Best laptop ever!',                   '2026-04-18T21:30:00'),
        -- Order 12 (April 22, user 2, delivered): products 16, 17
        (14, 2,  16, 12, 4, N'Nồi chiên không dầu nấu nhanh, đồ ăn giòn ngon.',                             '2026-04-28T12:00:00'),
        (15, 2,  17, 12, 5, N'Bộ dao sắc bén, block gỗ đẹp. Giá hợp lý.',                                  '2026-04-28T12:05:00'),
        -- Order 13 (April 28, user 14, delivered): product 18
        (16, 14, 18, 13, 5, N'Đọc lại lần 2 vẫn thấy hay. Classic không bao giờ lỗi thời.',                 '2026-05-04T17:30:00'),
        -- Order 14 (May 2, user 15, delivered): product 4
        (17, 15, 4,  14, 4, N'Quần jean co giãn tốt, dáng slim vừa vặn.',                                   '2026-05-08T10:15:00'),
        -- Order 15 (May 7, user 16, delivered): product 11
        (18, 16, 11, 15, 5, N'ThinkPad bàn phím gõ sướng nhất, bền bỉ. Business laptop number 1.',          '2026-05-13T15:45:00'),
        -- Order 17 (May 15, user 4, delivered): products 6, 13
        (19, 4,  6,  17, 4, N'Giày sneaker tốt, nhưng size hơi nhỏ. Nên lấy tăng 1 size.',                  '2026-05-21T09:00:00'),
        (20, 4,  13, 17, 4, N'Sạc nhanh GaN gọn nhẹ, mang đi công tác tiện.',                               '2026-05-21T09:05:00');
      SET IDENTITY_INSERT reviews OFF;
    `);
    console.log('  + reviews: 20 rows');

    await qr.release();
  },
};
