import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RecentlyViewed } from '../entities/recently-viewed.entity';

// SQL Server unique/duplicate-key error numbers.
const SQL_UNIQUE_VIOLATION = 2627;
const SQL_DUPLICATE_KEY = 2601;
// SQL Server FK violation — a stale product id from guest history whose product
// was deleted; skip it rather than fail the whole merge.
const SQL_FK_VIOLATION = 547;

function isUniqueViolation(err: unknown): boolean {
  const n = (err as { number?: number })?.number;
  return n === SQL_UNIQUE_VIOLATION || n === SQL_DUPLICATE_KEY;
}

@Injectable()
export class RecentlyViewedRepository {
  constructor(
    @InjectRepository(RecentlyViewed)
    private readonly repo: Repository<RecentlyViewed>,
  ) {}

  /**
   * Record (or refresh) a view. On the UNIQUE (user_id, product_id) pair, an
   * existing row has its `viewed_at` bumped to now; otherwise a new row is
   * inserted. `viewed_at` uses SYSUTCDATETIME() to stay UTC-consistent. The
   * insert path catches the concurrent-insert race (unique violation → re-bump).
   */
  async upsertView(userId: number, productId: number): Promise<void> {
    const existing = await this.repo.findOne({
      where: { user_id: userId, product_id: productId },
      select: ['id'],
    });

    if (existing) {
      await this.repo.update(existing.id, {
        viewed_at: () => 'SYSUTCDATETIME()',
      });
      return;
    }

    try {
      await this.repo.insert({ user_id: userId, product_id: productId });
    } catch (err) {
      if (!isUniqueViolation(err)) throw err;
      await this.repo.update(
        { user_id: userId, product_id: productId },
        { viewed_at: () => 'SYSUTCDATETIME()' },
      );
    }
  }

  /** Product ids for a user, newest view first, capped at `limit`. */
  async findTopProductIds(userId: number, limit = 20): Promise<number[]> {
    const rows = await this.repo.find({
      where: { user_id: userId },
      select: ['product_id'],
      order: { viewed_at: 'DESC', id: 'DESC' },
      take: limit,
    });
    return rows.map((r) => r.product_id);
  }

  /** Delete rows beyond the newest `keep` for a user (enforce the cap). */
  async pruneToLimit(userId: number, keep = 20): Promise<void> {
    // `keep` is an internal constant, never user input — safe to inline.
    await this.repo.query(
      `DELETE FROM recently_viewed
       WHERE user_id = @0 AND id NOT IN (
         SELECT TOP (${keep}) id FROM recently_viewed
         WHERE user_id = @0 ORDER BY viewed_at DESC, id DESC
       )`,
      [userId],
    );
  }

  /** Upsert many (product_id, viewed_at) pairs, keeping the newest timestamp. */
  async bulkUpsert(
    userId: number,
    items: { product_id: number; viewed_at: Date }[],
  ): Promise<void> {
    for (const item of items) {
      const existing = await this.repo.findOne({
        where: { user_id: userId, product_id: item.product_id },
        select: ['id', 'viewed_at'],
      });

      if (existing) {
        if (item.viewed_at > existing.viewed_at) {
          await this.repo.update(existing.id, { viewed_at: item.viewed_at });
        }
        continue;
      }

      try {
        await this.repo.insert({
          user_id: userId,
          product_id: item.product_id,
          viewed_at: item.viewed_at,
        });
      } catch (err) {
        // Unique race → another insert won; FK → stale product id. Both: skip.
        if (
          !isUniqueViolation(err) &&
          (err as { number?: number })?.number !== SQL_FK_VIOLATION
        ) {
          throw err;
        }
      }
    }
  }
}
