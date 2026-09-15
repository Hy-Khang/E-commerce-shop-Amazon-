import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import { PaymentTransaction } from '../entities/payment-transaction.entity';
import { TransactionStatus } from '../../../common/constants';

@Injectable()
export class PaymentTransactionRepository {
  constructor(
    @InjectRepository(PaymentTransaction)
    private readonly repo: Repository<PaymentTransaction>,
  ) {}

  async create(data: Partial<PaymentTransaction>): Promise<PaymentTransaction> {
    const transaction = this.repo.create(data);
    return this.repo.save(transaction);
  }

  async findByTransactionRef(
    transactionRef: string,
  ): Promise<PaymentTransaction | null> {
    return this.repo.findOne({ where: { transaction_ref: transactionRef } });
  }

  async findByOrderId(orderId: number): Promise<PaymentTransaction[]> {
    return this.repo.find({
      where: { order_id: orderId },
      order: { created_at: 'DESC' },
    });
  }

  async findPendingByOrderId(
    orderId: number,
  ): Promise<PaymentTransaction | null> {
    return this.repo.findOne({
      where: { order_id: orderId, status: TransactionStatus.Pending },
      order: { created_at: 'DESC' },
    });
  }

  async updateStatus(
    id: number,
    status: string,
    gatewayTransactionId?: string,
    gatewayResponse?: string,
  ): Promise<void> {
    const updateData: Partial<PaymentTransaction> = {
      status,
      updated_at: new Date(),
    };
    if (gatewayTransactionId !== undefined) {
      updateData.gateway_transaction_id = gatewayTransactionId;
    }
    if (gatewayResponse !== undefined) {
      updateData.gateway_response = gatewayResponse;
    }
    await this.repo.update(id, updateData);
  }

  async findPendingByGroupId(
    groupId: string,
  ): Promise<PaymentTransaction | null> {
    return this.repo.findOne({
      where: { order_group_id: groupId, status: TransactionStatus.Pending },
      order: { created_at: 'DESC' },
    });
  }

  async findByGroupId(groupId: string): Promise<PaymentTransaction[]> {
    return this.repo.find({
      where: { order_group_id: groupId },
      order: { created_at: 'DESC' },
    });
  }

  async findExpiredPending(cutoffDate: Date): Promise<PaymentTransaction[]> {
    return this.repo.find({
      where: {
        status: TransactionStatus.Pending,
        created_at: LessThan(cutoffDate),
      },
    });
  }
}
