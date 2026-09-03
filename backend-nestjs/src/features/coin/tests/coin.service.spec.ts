import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { CoinService } from '../coin.service';
import { CoinBatchRepository } from '../repositories/coin-batch.repository';
import { CoinTransactionRepository } from '../repositories/coin-transaction.repository';
import { CoinBatchStatus, CoinTransactionType } from '../types/coin.types';
import type { CoinConfig } from '../../settings/types/settings.types';

const CONFIG: CoinConfig = {
  enabled: true,
  earn_rate_percent: 1,
  redeem_max_percent: 50,
  expiry_days: 90,
};

describe('CoinService', () => {
  let service: CoinService;
  let batchRepo: jest.Mocked<CoinBatchRepository>;
  let txnRepo: jest.Mocked<CoinTransactionRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CoinService,
        {
          provide: CoinBatchRepository,
          useValue: {
            getActiveBalance: jest.fn(),
            findExpiringSoon: jest.fn().mockResolvedValue([]),
            findConsumableBatches: jest.fn(),
            consume: jest.fn(),
            createBatch: jest.fn().mockResolvedValue({ id: 99 }),
            findExpiredActiveBatches: jest.fn(),
            markExpired: jest.fn(),
            findEarnBatchByOrderId: jest.fn(),
            reverseEarnBatch: jest.fn(),
          },
        },
        {
          provide: CoinTransactionRepository,
          useValue: {
            create: jest.fn(),
            existsByOrderAndType: jest.fn().mockResolvedValue(false),
            findByUserPaginated: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(CoinService);
    batchRepo = module.get(CoinBatchRepository);
    txnRepo = module.get(CoinTransactionRepository);
  });

  describe('validateRedemption', () => {
    it('returns 0 when nothing requested', async () => {
      expect(await service.validateRedemption(1, 0, 100000, CONFIG)).toBe(0);
    });

    it('rejects non-integer with COIN_003', async () => {
      await expect(
        service.validateRedemption(1, 10.5, 100000, CONFIG),
      ).rejects.toMatchObject({ response: { code: 'COIN_003' } });
    });

    it('returns 0 (ignores) when feature disabled', async () => {
      expect(
        await service.validateRedemption(1, 100, 100000, {
          ...CONFIG,
          enabled: false,
        }),
      ).toBe(0);
      expect(batchRepo.getActiveBalance).not.toHaveBeenCalled();
    });

    it('clamps to the 50% cap instead of throwing', async () => {
      // cap = 50% of 100000 = 50000; balance is ample
      batchRepo.getActiveBalance.mockResolvedValue(1_000_000);
      expect(await service.validateRedemption(1, 50001, 100000, CONFIG)).toBe(
        50000,
      );
    });

    it('clamps to the balance instead of throwing', async () => {
      batchRepo.getActiveBalance.mockResolvedValue(3000);
      expect(await service.validateRedemption(1, 5000, 100000, CONFIG)).toBe(
        3000,
      );
    });

    it('accepts a valid amount unchanged', async () => {
      batchRepo.getActiveBalance.mockResolvedValue(50000);
      expect(await service.validateRedemption(1, 5000, 100000, CONFIG)).toBe(
        5000,
      );
    });
  });

  describe('redeemForCheckout (FIFO)', () => {
    it('consumes across batches oldest-first and logs one redeem txn', async () => {
      batchRepo.findConsumableBatches.mockResolvedValue([
        { id: 1, amount_remaining: 3000 } as any,
        { id: 2, amount_remaining: 5000 } as any,
      ]);
      batchRepo.consume.mockResolvedValue(true);
      const manager = {} as any;

      const spent = await service.redeemForCheckout(
        1,
        4000,
        10,
        'grp',
        manager,
      );

      expect(spent).toBe(4000);
      expect(batchRepo.consume).toHaveBeenNthCalledWith(1, 1, 3000, manager);
      expect(batchRepo.consume).toHaveBeenNthCalledWith(2, 2, 1000, manager);
      expect(txnRepo.create).toHaveBeenCalledTimes(1);
      expect(txnRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          type: CoinTransactionType.Redeem,
          amount: 4000,
        }),
        manager,
      );
    });

    it('throws COIN_001 if batches cannot cover the amount', async () => {
      batchRepo.findConsumableBatches.mockResolvedValue([
        { id: 1, amount_remaining: 1000 } as any,
      ]);
      batchRepo.consume.mockResolvedValue(true);
      await expect(
        service.redeemForCheckout(1, 4000, 10, 'grp', {} as any),
      ).rejects.toMatchObject({ response: { code: 'COIN_001' } });
    });
  });

  describe('awardForOrder', () => {
    const order = {
      id: 7,
      user_id: 2,
      total_amount: 105000,
      shipping_fee: 5000,
    };

    it('earns floor((total-shipping) * rate%) and creates batch + txn', async () => {
      await service.awardForOrder(order, CONFIG);
      // base = 100000, 1% = 1000
      expect(batchRepo.createBatch).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 2,
          source_order_id: 7,
          amount_earned: 1000,
          amount_remaining: 1000,
          status: CoinBatchStatus.Active,
        }),
      );
      expect(txnRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          type: CoinTransactionType.Earn,
          amount: 1000,
        }),
      );
    });

    it('is idempotent — skips when an earn txn already exists', async () => {
      txnRepo.existsByOrderAndType.mockResolvedValue(true);
      await service.awardForOrder(order, CONFIG);
      expect(batchRepo.createBatch).not.toHaveBeenCalled();
    });

    it('does nothing when disabled', async () => {
      await service.awardForOrder(order, { ...CONFIG, enabled: false });
      expect(batchRepo.createBatch).not.toHaveBeenCalled();
    });
  });

  describe('reverseEarnForOrder', () => {
    it('claws back only the unspent remainder', async () => {
      batchRepo.findEarnBatchByOrderId.mockResolvedValue({ id: 5 } as any);
      batchRepo.reverseEarnBatch.mockResolvedValue(700);
      await service.reverseEarnForOrder({ id: 7, user_id: 2 });
      expect(txnRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          type: CoinTransactionType.ReverseEarn,
          amount: 700,
        }),
      );
    });

    it('no-ops when there is no earn batch', async () => {
      batchRepo.findEarnBatchByOrderId.mockResolvedValue(null);
      await service.reverseEarnForOrder({ id: 7, user_id: 2 });
      expect(txnRepo.create).not.toHaveBeenCalled();
    });
  });

  describe('refundRedemptionForOrder', () => {
    it('mints a fresh batch equal to coin_discount', async () => {
      await service.refundRedemptionForOrder(
        { id: 7, user_id: 2, coin_discount: 2000 },
        CONFIG,
      );
      expect(batchRepo.createBatch).toHaveBeenCalledWith(
        expect.objectContaining({
          source_order_id: null,
          amount_earned: 2000,
          amount_remaining: 2000,
        }),
      );
      expect(txnRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          type: CoinTransactionType.Refund,
          amount: 2000,
        }),
      );
    });

    it('no-ops when the order redeemed no Xu', async () => {
      await service.refundRedemptionForOrder(
        { id: 7, user_id: 2, coin_discount: 0 },
        CONFIG,
      );
      expect(batchRepo.createBatch).not.toHaveBeenCalled();
    });
  });

  describe('expireBatches', () => {
    it('marks each expired batch and writes an expire txn', async () => {
      batchRepo.findExpiredActiveBatches.mockResolvedValue([
        { id: 1, user_id: 2, amount_remaining: 500 } as any,
        { id: 2, user_id: 3, amount_remaining: 800 } as any,
      ]);
      const count = await service.expireBatches();
      expect(count).toBe(2);
      expect(batchRepo.markExpired).toHaveBeenCalledTimes(2);
      expect(txnRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          type: CoinTransactionType.Expire,
          amount: 500,
        }),
      );
    });
  });
});
