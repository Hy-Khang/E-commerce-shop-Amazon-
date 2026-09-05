import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { CommissionService } from '../commission.service';
import { CommissionTransactionRepository } from '../repositories/commission-transaction.repository';
import { SellerWalletRepository } from '../repositories/seller-wallet.repository';
import { WalletTransactionRepository } from '../repositories/wallet-transaction.repository';
import { OrderCommissionContext } from '../types/seller-finance.types';
import {
  CommissionConfig,
  CommissionMode,
} from '../../settings/types/settings.types';
import { computeCommission } from '../utils/commission.util';

const FLAT: CommissionConfig = {
  enabled: true,
  mode: CommissionMode.Flat,
  rate_percent: 10,
};

function ctx(
  overrides: Partial<OrderCommissionContext> = {},
): OrderCommissionContext {
  return {
    order_id: 1,
    shop_id: 5,
    seller_user_id: 9,
    total_amount: 110000,
    shipping_fee: 10000,
    items: [],
    ...overrides,
  };
}

describe('commission.util computeCommission', () => {
  it('flat: floor(base × rate%)', () => {
    // base = 110000 - 10000 = 100000; 10% → 10000
    expect(computeCommission(ctx(), FLAT, new Map())).toBe(10000);
  });

  it('flat: zero base → 0', () => {
    expect(
      computeCommission(ctx({ total_amount: 10000, shipping_fee: 10000 }), FLAT, new Map()),
    ).toBe(0);
  });

  it('category: applies per-category rate, falls back to platform rate', () => {
    const config: CommissionConfig = { ...FLAT, mode: CommissionMode.Category };
    // base 100000 split by line_total 60000 / 40000 → 60000 & 40000
    // cat 1 → 20%, cat 2 → no override → 10%
    const rates = new Map<number, number>([[1, 20]]);
    const result = computeCommission(
      ctx({
        items: [
          { line_total: 60000, category_id: 1 },
          { line_total: 40000, category_id: 2 },
        ],
      }),
      config,
      rates,
    );
    // 60000×20% + 40000×10% = 12000 + 4000 = 16000
    expect(result).toBe(16000);
  });

  it('category with no items degrades to flat', () => {
    const config: CommissionConfig = { ...FLAT, mode: CommissionMode.Category };
    expect(computeCommission(ctx({ items: [] }), config, new Map())).toBe(10000);
  });
});

describe('CommissionService', () => {
  let service: CommissionService;
  let commissionRepo: jest.Mocked<CommissionTransactionRepository>;
  let walletRepo: jest.Mocked<SellerWalletRepository>;
  let walletTxnRepo: jest.Mocked<WalletTransactionRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommissionService,
        {
          provide: CommissionTransactionRepository,
          useValue: {
            create: jest.fn(),
            existsByOrderAndType: jest.fn().mockResolvedValue(false),
            findByOrderAndType: jest.fn(),
          },
        },
        {
          provide: SellerWalletRepository,
          useValue: {
            credit: jest.fn(),
            debitAllowNegative: jest.fn(),
          },
        },
        {
          provide: WalletTransactionRepository,
          useValue: { create: jest.fn() },
        },
        {
          provide: DataSource,
          useValue: {
            transaction: jest.fn(async (cb: any) => cb({} as any)),
          },
        },
      ],
    }).compile();

    service = module.get(CommissionService);
    commissionRepo = module.get(CommissionTransactionRepository);
    walletRepo = module.get(SellerWalletRepository);
    walletTxnRepo = module.get(WalletTransactionRepository);
  });

  describe('chargeForOrder', () => {
    it('no-op when disabled', async () => {
      await service.chargeForOrder(ctx(), { ...FLAT, enabled: false }, new Map());
      expect(commissionRepo.create).not.toHaveBeenCalled();
      expect(walletRepo.credit).not.toHaveBeenCalled();
    });

    it('idempotent: skips when a charge already exists', async () => {
      commissionRepo.existsByOrderAndType.mockResolvedValue(true);
      await service.chargeForOrder(ctx(), FLAT, new Map());
      expect(commissionRepo.create).not.toHaveBeenCalled();
      expect(walletRepo.credit).not.toHaveBeenCalled();
    });

    it('charges commission and credits net into the wallet', async () => {
      await service.chargeForOrder(ctx(), FLAT, new Map());

      expect(commissionRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          shop_id: 5,
          user_id: 9,
          order_id: 1,
          base_amount: 100000,
          commission_amount: 10000,
          type: 'charge',
        }),
        expect.anything(),
      );
      // net = 100000 - 10000 = 90000
      expect(walletRepo.credit).toHaveBeenCalledWith(9, 90000, expect.anything());
      expect(walletTxnRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 9,
          type: 'sale_earning',
          amount: 90000,
          order_id: 1,
        }),
        expect.anything(),
      );
    });

    it('no-op when net base ≤ 0', async () => {
      await service.chargeForOrder(
        ctx({ total_amount: 10000, shipping_fee: 10000 }),
        FLAT,
        new Map(),
      );
      expect(commissionRepo.create).not.toHaveBeenCalled();
    });
  });

  describe('reverseForOrder', () => {
    it('no-op when the order was never charged', async () => {
      commissionRepo.findByOrderAndType.mockResolvedValue(null);
      await service.reverseForOrder(1);
      expect(commissionRepo.create).not.toHaveBeenCalled();
      expect(walletRepo.debitAllowNegative).not.toHaveBeenCalled();
    });

    it('idempotent: skips when a reverse already exists', async () => {
      commissionRepo.existsByOrderAndType.mockResolvedValue(true);
      await service.reverseForOrder(1);
      expect(commissionRepo.findByOrderAndType).not.toHaveBeenCalled();
      expect(commissionRepo.create).not.toHaveBeenCalled();
    });

    it('reverses the charge and debits net (allowing debt)', async () => {
      commissionRepo.existsByOrderAndType.mockResolvedValue(false);
      commissionRepo.findByOrderAndType.mockResolvedValue({
        shop_id: 5,
        user_id: 9,
        base_amount: 100000,
        commission_amount: 10000,
        rate_percent: 10,
      } as any);

      await service.reverseForOrder(1);

      expect(commissionRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'reverse', order_id: 1 }),
        expect.anything(),
      );
      expect(walletRepo.debitAllowNegative).toHaveBeenCalledWith(
        9,
        90000,
        expect.anything(),
      );
      expect(walletTxnRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'reversal', amount: 90000 }),
        expect.anything(),
      );
    });
  });
});
