import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Cron } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { PaymentTransactionRepository } from './repositories/payment-transaction.repository';
import { VnpayService } from './vnpay.service';
import { MomoService } from './momo.service';
import { OrderService } from '../order/order.service';
import {
  PaymentTransactionResponseDto,
  toPaymentTransactionResponse,
} from './dto/payment-response.dto';
import {
  OrderStatus,
  PaymentGateway,
  PaymentMethod,
  PaymentStatus,
  TransactionStatus,
} from '../../common/constants';
import { generateTransactionRef } from './utils/payment.util';
import { IMomoIpnPayload, IVnpayIpnResponse } from './types/payment.types';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);
  private readonly frontendUrl: string;

  constructor(
    private readonly paymentTransactionRepository: PaymentTransactionRepository,
    private readonly vnpayService: VnpayService,
    private readonly momoService: MomoService,
    private readonly orderService: OrderService,
    private readonly eventEmitter: EventEmitter2,
    private readonly configService: ConfigService,
  ) {
    this.frontendUrl = this.configService.get<string>(
      'FRONTEND_URL',
      'http://localhost:5173',
    );
  }

  async createPayment(
    userId: number,
    orderId: number,
    ipAddress: string,
  ): Promise<{ payment_url: string }> {
    const order = await this.orderService.findOrderForPayment(
      orderId,
      userId,
    );

    if (!order) {
      throw new NotFoundException({
        code: 'ORDER_001',
        message: 'Order not found',
      });
    }

    if (order.status === OrderStatus.Cancelled) {
      throw new BadRequestException({
        code: 'PAYMENT_001',
        message: 'Order is cancelled and cannot be paid',
      });
    }

    if (order.payment_method === PaymentMethod.Cod) {
      throw new BadRequestException({
        code: 'PAYMENT_001',
        message: 'COD orders do not require online payment',
      });
    }

    if (order.payment_status === PaymentStatus.Paid) {
      throw new BadRequestException({
        code: 'PAYMENT_001',
        message: 'Order has already been paid',
      });
    }

    const existingPending =
      await this.paymentTransactionRepository.findPendingByOrderId(orderId);
    if (existingPending) {
      throw new BadRequestException({
        code: 'PAYMENT_002',
        message: 'A pending payment already exists for this order',
      });
    }

    const gateway =
      order.payment_method === PaymentMethod.VnPay
        ? PaymentGateway.VnPay
        : PaymentGateway.Momo;
    const transactionRef = generateTransactionRef(orderId);
    const amount = Number(order.total_amount);
    const orderInfo = `Thanh toan don hang ${orderId}`;

    const transaction = await this.paymentTransactionRepository.create({
      order_id: orderId,
      transaction_ref: transactionRef,
      gateway,
      amount,
      status: TransactionStatus.Pending,
    });

    this.logger.log(
      `Payment transaction #${transaction.id} created for order #${orderId}, gateway: ${gateway}`,
    );

    let paymentUrl: string;

    if (gateway === PaymentGateway.VnPay) {
      paymentUrl = this.vnpayService.createPaymentUrl(
        transactionRef,
        amount,
        orderInfo,
        ipAddress,
      );
    } else {
      const momoResponse = await this.momoService.createPayment(
        transactionRef,
        amount,
        orderInfo,
      );
      if (momoResponse.resultCode !== 0) {
        await this.paymentTransactionRepository.updateStatus(
          transaction.id,
          TransactionStatus.Failed,
          undefined,
          JSON.stringify(momoResponse),
        );
        throw new BadRequestException({
          code: 'PAYMENT_006',
          message: `MoMo gateway error: ${momoResponse.message}`,
        });
      }
      paymentUrl = momoResponse.payUrl;
    }

    return { payment_url: paymentUrl };
  }

  async handleVnpayIpn(
    query: Record<string, string>,
  ): Promise<IVnpayIpnResponse> {
    if (!this.vnpayService.verifyIpnSignature(query)) {
      this.logger.warn('VNPay IPN: invalid signature');
      return { RspCode: '97', Message: 'Invalid Checksum' };
    }

    const transactionRef = query['vnp_TxnRef'];
    const responseCode = query['vnp_ResponseCode'];
    const vnpAmount = parseInt(query['vnp_Amount'], 10) / 100;
    const gatewayTransactionId = query['vnp_TransactionNo'];

    const transaction =
      await this.paymentTransactionRepository.findByTransactionRef(
        transactionRef,
      );
    if (!transaction) {
      this.logger.warn(
        `VNPay IPN: transaction not found for ref ${transactionRef}`,
      );
      return { RspCode: '01', Message: 'Order not Found' };
    }

    if (transaction.status !== TransactionStatus.Pending) {
      return { RspCode: '02', Message: 'Order already confirmed' };
    }

    if (Math.abs(Number(transaction.amount) - vnpAmount) > 0.01) {
      this.logger.warn(
        `VNPay IPN: amount mismatch for ref ${transactionRef}. Expected ${transaction.amount}, got ${vnpAmount}`,
      );
      return { RspCode: '04', Message: 'Invalid Amount' };
    }

    if (responseCode === '00') {
      await this.paymentTransactionRepository.updateStatus(
        transaction.id,
        TransactionStatus.Completed,
        gatewayTransactionId,
        JSON.stringify(query),
      );

      this.eventEmitter.emit('payment.completed', {
        orderId: transaction.order_id,
        transactionRef,
      });

      this.logger.log(
        `VNPay IPN: payment completed for order #${transaction.order_id}`,
      );
    } else {
      await this.paymentTransactionRepository.updateStatus(
        transaction.id,
        TransactionStatus.Failed,
        gatewayTransactionId,
        JSON.stringify(query),
      );
      this.logger.log(
        `VNPay IPN: payment failed for order #${transaction.order_id}, code: ${responseCode}`,
      );
    }

    return { RspCode: '00', Message: 'Confirm Success' };
  }

  buildVnpayReturnRedirect(query: Record<string, string>): string {
    const txnRef = query['vnp_TxnRef'] || '';
    const match = txnRef.match(/^ORD(\d+)/);
    const orderId = match ? match[1] : '';
    const responseCode = query['vnp_ResponseCode'];
    const status = responseCode === '00' ? 'success' : 'failed';
    return `${this.frontendUrl}/checkout/payment-result?orderId=${orderId}&status=${status}`;
  }

  async handleMomoIpn(payload: IMomoIpnPayload): Promise<void> {
    if (!this.momoService.verifyIpnSignature(payload)) {
      this.logger.warn('MoMo IPN: invalid signature');
      return;
    }

    const transactionRef = payload.orderId;
    const transaction =
      await this.paymentTransactionRepository.findByTransactionRef(
        transactionRef,
      );

    if (!transaction) {
      this.logger.warn(
        `MoMo IPN: transaction not found for ref ${transactionRef}`,
      );
      return;
    }

    if (transaction.status !== TransactionStatus.Pending) {
      return;
    }

    if (payload.resultCode === 0) {
      await this.paymentTransactionRepository.updateStatus(
        transaction.id,
        TransactionStatus.Completed,
        String(payload.transId),
        JSON.stringify(payload),
      );

      this.eventEmitter.emit('payment.completed', {
        orderId: transaction.order_id,
        transactionRef,
      });

      this.logger.log(
        `MoMo IPN: payment completed for order #${transaction.order_id}`,
      );
    } else {
      await this.paymentTransactionRepository.updateStatus(
        transaction.id,
        TransactionStatus.Failed,
        String(payload.transId),
        JSON.stringify(payload),
      );
      this.logger.log(
        `MoMo IPN: payment failed for order #${transaction.order_id}, resultCode: ${payload.resultCode}`,
      );
    }
  }

  buildMomoReturnRedirect(query: Record<string, string>): string {
    const transactionRef = query['orderId'] || '';
    const match = transactionRef.match(/^ORD(\d+)/);
    const orderId = match ? match[1] : '';
    const resultCode = query['resultCode'];
    const status = resultCode === '0' ? 'success' : 'failed';
    return `${this.frontendUrl}/checkout/payment-result?orderId=${orderId}&status=${status}`;
  }

  async getPaymentsByOrder(
    orderId: number,
    userId: number,
  ): Promise<PaymentTransactionResponseDto[]> {
    const order = await this.orderService.findOrderForPayment(
      orderId,
      userId,
    );
    if (!order) {
      throw new NotFoundException({
        code: 'ORDER_001',
        message: 'Order not found',
      });
    }

    const transactions =
      await this.paymentTransactionRepository.findByOrderId(orderId);
    return transactions.map(toPaymentTransactionResponse);
  }

  @Cron('*/5 * * * *')
  async handlePaymentTimeout(): Promise<void> {
    const cutoff = new Date(Date.now() - 15 * 60 * 1000);
    const expiredTransactions =
      await this.paymentTransactionRepository.findExpiredPending(cutoff);

    if (expiredTransactions.length === 0) return;

    for (const tx of expiredTransactions) {
      await this.paymentTransactionRepository.updateStatus(
        tx.id,
        TransactionStatus.Failed,
      );
    }

    this.logger.log(
      `Payment timeout: marked ${expiredTransactions.length} transactions as failed`,
    );
  }
}
