import { Brackets } from 'typeorm';
import { CouponRepository } from '../repositories/coupon.repository';

/**
 * The availability catalog leans entirely on `findAvailableForCart`'s WHERE
 * clause to hide coupons checkout would reject for an invisible reason
 * (expired / inactive / exhausted / admin-locked / suspended shop). The service
 * spec mocks this repo away, so the SQL gates are verified here instead.
 *
 * There is no DB test harness in this project, so we drive the real method with
 * a recording QueryBuilder stub and assert on the SQL fragments it emits —
 * including the ones nested inside `Brackets`.
 */
function recordingQb(fragments: string[]) {
  const qb: any = {};
  const record = (arg: unknown) => {
    if (typeof arg === 'string') fragments.push(arg);
    else if (arg instanceof Brackets) {
      (arg as unknown as { whereFactory: (q: unknown) => void }).whereFactory(
        qb,
      );
    }
    return qb;
  };
  qb.leftJoinAndSelect = () => qb;
  qb.where = (a: unknown) => record(a);
  qb.andWhere = (a: unknown) => record(a);
  qb.orWhere = (a: unknown) => record(a);
  qb.orderBy = () => qb;
  qb.getMany = jest.fn().mockResolvedValue([]);
  return qb;
}

function makeRepo(fragments: string[]): CouponRepository {
  const inner: any = { createQueryBuilder: () => recordingQb(fragments) };
  return new CouponRepository(inner);
}

describe('CouponRepository.findAvailableForCart', () => {
  it('applies the static validity gates (active, not admin-locked, in window, not exhausted)', async () => {
    const f: string[] = [];
    await makeRepo(f).findAvailableForCart([1, 2], new Date());
    const sql = f.join(' | ');
    expect(sql).toContain('coupon.is_active = :active');
    expect(sql).toContain('coupon.admin_disabled = :disabled');
    expect(sql).toContain('coupon.starts_at <= :now');
    expect(sql).toContain('coupon.expires_at >= :now');
    expect(sql).toContain('coupon.max_uses IS NULL');
    expect(sql).toContain('coupon.current_uses < coupon.max_uses');
  });

  it('for a non-empty cart, gates shop coupons by IN + active shop but never gates platform coupons', async () => {
    const f: string[] = [];
    await makeRepo(f).findAvailableForCart([1, 2], new Date());
    const sql = f.join(' | ');
    expect(sql).toContain('coupon.shop_id IS NULL'); // platform stays in
    expect(sql).toContain('coupon.shop_id IN (:...shopIds)');
    expect(sql).toContain('shop.status = :activeStatus');
  });

  it('for an empty shop-id list, restricts to platform coupons without emitting an IN ()', async () => {
    const f: string[] = [];
    await makeRepo(f).findAvailableForCart([], new Date());
    const sql = f.join(' | ');
    expect(sql).toContain('coupon.shop_id IS NULL');
    expect(sql).not.toContain('IN (:...shopIds)');
    expect(sql).not.toContain('shop.status');
  });
});
