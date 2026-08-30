import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Conversation } from '../entities/conversation.entity';
import { SenderType } from '../types/chat.types';

// SQL Server unique/duplicate-key error numbers (concurrent findOrCreate race).
const SQL_UNIQUE_VIOLATION = 2627;
const SQL_DUPLICATE_KEY = 2601;

function isUniqueViolation(err: unknown): boolean {
  const n = (err as { number?: number })?.number;
  return n === SQL_UNIQUE_VIOLATION || n === SQL_DUPLICATE_KEY;
}

/** A conversation joined with shop + customer display fields for list rendering. */
export interface IConversationListRow {
  id: number;
  customer_id: number;
  shop_id: number;
  last_message_at: Date | null;
  last_message_preview: string | null;
  customer_unread: number;
  seller_unread: number;
  shop_name: string;
  shop_logo_url: string | null;
  customer_name: string;
}

@Injectable()
export class ConversationRepository {
  constructor(
    @InjectRepository(Conversation)
    private readonly repo: Repository<Conversation>,
  ) {}

  async findById(id: number): Promise<Conversation | null> {
    return this.repo.findOne({ where: { id } });
  }

  async findByCustomerAndShop(
    customerId: number,
    shopId: number,
  ): Promise<Conversation | null> {
    return this.repo.findOne({
      where: { customer_id: customerId, shop_id: shopId },
    });
  }

  /** Idempotent: returns the existing (customer, shop) conversation or creates it. */
  async findOrCreate(
    customerId: number,
    shopId: number,
  ): Promise<Conversation> {
    const existing = await this.findByCustomerAndShop(customerId, shopId);
    if (existing) return existing;

    try {
      const created = this.repo.create({
        customer_id: customerId,
        shop_id: shopId,
      });
      return await this.repo.save(created);
    } catch (err) {
      if (!isUniqueViolation(err)) throw err;
      // Lost the race — the other insert won; return the now-existing row.
      return (await this.findByCustomerAndShop(customerId, shopId))!;
    }
  }

  /**
   * Conversations the caller participates in — as the customer (`customerId`)
   * or as the seller who owns `shopId` (may be null when the caller has no
   * shop). Newest activity first. Joins shop + customer display fields.
   */
  async listForParticipant(
    customerId: number,
    shopId: number | null,
  ): Promise<IConversationListRow[]> {
    const qb = this.repo
      .createQueryBuilder('c')
      .innerJoin('shops', 's', 's.id = c.shop_id')
      .innerJoin('users', 'u', 'u.id = c.customer_id')
      .select([
        'c.id AS id',
        'c.customer_id AS customer_id',
        'c.shop_id AS shop_id',
        'c.last_message_at AS last_message_at',
        'c.last_message_preview AS last_message_preview',
        'c.customer_unread AS customer_unread',
        'c.seller_unread AS seller_unread',
        's.name AS shop_name',
        's.logo_url AS shop_logo_url',
        'u.full_name AS customer_name',
      ])
      .where('c.customer_id = :customerId', { customerId });

    if (shopId != null) {
      qb.orWhere('c.shop_id = :shopId', { shopId });
    }

    qb.orderBy('c.last_message_at', 'DESC').addOrderBy('c.id', 'DESC');

    return qb.getRawMany<IConversationListRow>();
  }

  /**
   * On a new message, bump the activity fields and (unless the recipient is
   * actively viewing the thread) atomically increment their unread counter.
   */
  async bumpOnNewMessage(
    conversationId: number,
    recipientSide: SenderType,
    preview: string,
    at: Date,
    incrementUnread: boolean,
  ): Promise<void> {
    const unreadColumn =
      recipientSide === SenderType.Customer
        ? 'customer_unread'
        : 'seller_unread';

    const set: Record<string, unknown> = {
      last_message_at: at,
      last_message_preview: preview,
    };
    if (incrementUnread) {
      set[unreadColumn] = () => `${unreadColumn} + 1`;
    }

    await this.repo
      .createQueryBuilder()
      .update(Conversation)
      .set(set)
      .where('id = :id', { id: conversationId })
      .execute();
  }

  /** Reset the calling side's unread counter (on opening / marking read). */
  async resetUnread(conversationId: number, side: SenderType): Promise<void> {
    const unreadColumn =
      side === SenderType.Customer ? 'customer_unread' : 'seller_unread';

    await this.repo
      .createQueryBuilder()
      .update(Conversation)
      .set({ [unreadColumn]: 0 })
      .where('id = :id', { id: conversationId })
      .execute();
  }

  /** Total unread across all conversations for the caller's side(s). */
  async sumUnreadForParticipant(
    customerId: number,
    shopId: number | null,
  ): Promise<number> {
    const customerRow = await this.repo
      .createQueryBuilder('c')
      .select('COALESCE(SUM(c.customer_unread), 0)', 'total')
      .where('c.customer_id = :customerId', { customerId })
      .getRawOne<{ total: string }>();
    let total = Number(customerRow?.total ?? 0);

    if (shopId != null) {
      const sellerRow = await this.repo
        .createQueryBuilder('c')
        .select('COALESCE(SUM(c.seller_unread), 0)', 'total')
        .where('c.shop_id = :shopId', { shopId })
        .getRawOne<{ total: string }>();
      total += Number(sellerRow?.total ?? 0);
    }

    return total;
  }
}
