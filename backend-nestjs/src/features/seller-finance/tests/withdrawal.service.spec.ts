import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { WithdrawalService } from '../withdrawal.service';
import { WithdrawalRequestRepository } from '../repositories/withdrawal-request.repository';
import { SellerWalletRepository } from '../repositories/seller-wallet.repository';
import { WalletTransactionRepository } from '../repositories/wallet-transaction.repository';
import { WithdrawalStatus } from '../types/seller-finance.types';

const DTO = {
  amount: 50000,
  bank_name: 'VCB',
  bank_account_number: '0123456789',
  bank_account_holder: 'NGO HY KHANG',
};

describe('WithdrawalService', () => {
  let service: WithdrawalService;
  let withdrawalRepo: jest.Mocked<WithdrawalRequestRepository>;
  let walletRepo: jest.Mocked<SellerWalletRepository>;
  let walletTxnRepo: jest.Mocked<WalletTransactionRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WithdrawalService,
        {
          provide: WithdrawalRequestRepository,
          useValue: {
            create: jest.fn().mockResolvedValue({ id: 7 }),
            findById: jest.fn(),
            findPaginated: jest.fn(),
            update: jest.fn(),
          },
        },
        {
          provide: SellerWalletRepository,
          useValue: {
            debitIfSufficient: jest.fn(),
            credit: jest.fn(),
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

    service = module.get(WithdrawalService);
    withdrawalRepo = module.get(WithdrawalRequestRepository);
    walletRepo = module.get(SellerWalletRepository);
    walletTxnRepo = module.get(WalletTransactionRepository);
  });

  describe('requestWithdrawal', () => {
    it('holds the amount and creates a pending request', async () => {
      walletRepo.debitIfSufficient.mockResolvedValue(true);
      const result = await service.requestWithdrawal(9, DTO);

      expect(walletRepo.debitIfSufficient).toHaveBeenCalledWith(
        9,
        50000,
        expect.anything(),
      );
      expect(withdrawalRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ user_id: 9, amount: 50000, status: 'pending' }),
        expect.anything(),
      );
      expect(walletTxnRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'withdrawal', amount: 50000, withdrawal_id: 7 }),
        expect.anything(),
      );
      expect(result).toEqual({ id: 7 });
    });

    it('rejects with WALLET_002 on insufficient balance', async () => {
      walletRepo.debitIfSufficient.mockResolvedValue(false);
      await expect(service.requestWithdrawal(9, DTO)).rejects.toMatchObject({
        response: { code: 'WALLET_002' },
      });
      expect(withdrawalRepo.create).not.toHaveBeenCalled();
    });
  });

  describe('reviewWithdrawal', () => {
    it('approve: only pending → sets approved', async () => {
      withdrawalRepo.findById
        .mockResolvedValueOnce({ id: 7, status: WithdrawalStatus.Pending } as any)
        .mockResolvedValueOnce({ id: 7, status: WithdrawalStatus.Approved } as any);
      await service.approve(7, 1);
      expect(withdrawalRepo.update).toHaveBeenCalledWith(
        7,
        expect.objectContaining({ status: 'approved', reviewed_by: 1 }),
      );
    });

    it('reject: refunds the held amount back to the wallet', async () => {
      withdrawalRepo.findById
        .mockResolvedValueOnce({
          id: 7,
          user_id: 9,
          amount: 50000,
          status: WithdrawalStatus.Pending,
        } as any)
        .mockResolvedValueOnce({ id: 7, status: WithdrawalStatus.Rejected } as any);
      await service.reject(7, 1, 'invalid bank info');
      expect(walletRepo.credit).toHaveBeenCalledWith(9, 50000, expect.anything());
      expect(walletTxnRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'withdrawal_refund', amount: 50000 }),
        expect.anything(),
      );
    });

    it('rejects a non-pending withdrawal with WALLET_003', async () => {
      withdrawalRepo.findById.mockResolvedValue({
        id: 7,
        status: WithdrawalStatus.Approved,
      } as any);
      await expect(service.approve(7, 1)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });
  });
});
