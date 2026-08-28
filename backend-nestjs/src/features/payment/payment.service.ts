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
    dto: { order_id?: number; order_group_id?: string },
    ipAddress: string,
  ): Promise<{ payment_url: string }> {
    if (dto.order_group_id) {
      return this.createGroupPayment(userId, dto.order_group_id, ipAddress);
    }

    if (!dto.order_id) {
      throw new BadRequestException({
        code: 'PAYMENT_001',
        message: 'Either order_id or order_group_id is required',
      });
    }

    return this.createSingleOrderPayment(userId, dto.order_id, ipAddress);
  }

  private async createSingleOrderPayment(
    userId: number,
    orderId: number,
    ipAddress: string,
  ): Promise<{ payment_url: string }> {
    const order = await this.orderService.findOrderForPayment(orderId, userId);

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
      order_group_id: order.order_group_id,
      transaction_ref: transactionRef,
      gateway,
      amount,
      status: TransactionStatus.Pending,
    });

    this.logger.log(
      `Payment transaction #${transaction.id} created for order #${orderId}, gateway: ${gateway}`,
    );

    return this.buildPaymentUrl(gateway, transactionRef, amount, orderInfo, ipAddress, transaction.id);
  }

  private async createGroupPayment(
    userId: number,
    orderGroupId: string,
    ipAddress: string,
  ): Promise<{ payment_url: string }> {
    const orders = await this.orderService.findOrdersByGroupIdForPayment(
      orderGroupId,
      userId,
    );

    if (orders.length === 0) {
      throw new NotFoundException({
        code: 'ORDER_001',
        message: 'Order group not found',
      });
    }

    const activeOrders = orders.filter(
      (o) => o.status !== OrderStatus.Cancelled,
    );

    if (activeOrders.length === 0) {
      throw new BadRequestException({
        code: 'PAYMENT_001',
        message: 'All orders in this group are cancelled',
      });
    }

    const firstOrder = activeOrders[0];

    if (firstOrder.payment_method === PaymentMethod.Cod) {
      throw new BadRequestException({
        code: 'PAYMENT_001',
        message: 'COD orders do not require online payment',
      });
    }

    const alreadyPaid = activeOrders.some(
      (o) => o.payment_status === PaymentStatus.Paid,
    );
    if (alreadyPaid) {
      throw new BadRequestException({
        code: 'PAYMENT_001',
        message: 'Orders in this group have already been paid',
      });
    }

    const existingPending =
      await this.paymentTransactionRepository.findPendingByGroupId(
        orderGroupId,
      );
    if (existingPending) {
      throw new BadRequestException({
        code: 'PAYMENT_002',
        message: 'A pending payment already exists for this order group',
      });
    }

    const amount = activeOrders.reduce(
      (sum, o) => sum + Number(o.total_amount),
      0,
    );
    const gateway =
      firstOrder.payment_method === PaymentMethod.VnPay
        ? PaymentGateway.VnPay
        : PaymentGateway.Momo;
    const transactionRef = generateTransactionRef(firstOrder.id);
    const orderInfo = `Thanh toan nhom don hang ${orderGroupId.substring(0, 8)}`;

    const transaction = await this.paymentTransactionRepository.create({
      order_id: firstOrder.id,
      order_group_id: orderGroupId,
      transaction_ref: transactionRef,
      gateway,
      amount,
      status: TransactionStatus.Pending,
    });

    this.logger.log(
      `Group payment transaction #${transaction.id} created for group ${orderGroupId}, orders: ${activeOrders.map((o) => o.id).join(',')}, gateway: ${gateway}`,
    );

    return this.buildPaymentUrl(gateway, transactionRef, amount, orderInfo, ipAddress, transaction.id);
  }

  private async buildPaymentUrl(
    gateway: string,
    transactionRef: string,
    amount: number,
    orderInfo: string,
    ipAddress: string,
    transactionId: number,
  ): Promise<{ payment_url: string }> {
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
          transactionId,
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
        orderGroupId: transaction.order_group_id,
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

  async buildVnpayReturnRedirect(
    query: Record<string, string>,
  ): Promise<string> {
    const txnRef = query['vnp_TxnRef'] || '';
    const match = txnRef.match(/^ORD(\d+)/);
    const orderId = match ? match[1] : '';
    const responseCode = query['vnp_ResponseCode'];
    const status = responseCode === '00' ? 'success' : 'failed';

    const transaction =
      await this.paymentTransactionRepository.findByTransactionRef(txnRef);
    if (transaction?.order_group_id) {
      return `${this.frontendUrl}/checkout/payment-result?orderGroupId=${transaction.order_group_id}&status=${status}`;
    }

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
        orderGroupId: transaction.order_group_id,
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

  async buildMomoReturnRedirect(
    query: Record<string, string>,
  ): Promise<string> {
    const transactionRef = query['orderId'] || '';
    const match = transactionRef.match(/^ORD(\d+)/);
    const orderId = match ? match[1] : '';
    const resultCode = query['resultCode'];
    const status = resultCode === '0' ? 'success' : 'failed';

    const transaction =
      await this.paymentTransactionRepository.findByTransactionRef(
        transactionRef,
      );
    if (transaction?.order_group_id) {
      return `${this.frontendUrl}/checkout/payment-result?orderGroupId=${transaction.order_group_id}&status=${status}`;
    }

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

    return this.collectOrderTransactions(orderId, order.order_group_id);
  }

  // Admin-only variant — resolves the order without owner scope so an admin can
  // view an order's transactions without being the order owner. The controller
  // gates this with `payments:read` (held only by admin), so seller/shipper —
  // who hold `orders:read` but not `payments:read` — are blocked at the guard.
  async getPaymentsByOrderForAdmin(
    orderId: number,
  ): Promise<PaymentTransactionResponseDto[]> {
    const order = await this.orderService.findOrderForPaymentAdmin(orderId);
    if (!order) {
      throw new NotFoundException({
        code: 'ORDER_001',
        message: 'Order not found',
      });
    }

    return this.collectOrderTransactions(orderId, order.order_group_id);
  }

  // Merges an order's own transactions with any group-payment transactions
  // (deduplicated, newest first).
  private async collectOrderTransactions(
    orderId: number,
    orderGroupId: string,
  ): Promise<PaymentTransactionResponseDto[]> {
    const orderTransactions =
      await this.paymentTransactionRepository.findByOrderId(orderId);

    const groupTransactions =
      await this.paymentTransactionRepository.findByGroupId(orderGroupId);

    const seenIds = new Set(orderTransactions.map((t) => t.id));
    const merged = [...orderTransactions];
    for (const t of groupTransactions) {
      if (!seenIds.has(t.id)) {
        merged.push(t);
      }
    }

    merged.sort((a, b) => b.created_at.getTime() - a.created_at.getTime());

    return merged.map(toPaymentTransactionResponse);
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
