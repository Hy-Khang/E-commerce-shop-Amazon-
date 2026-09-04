import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { OrderService } from './order.service';

interface PaymentCompletedEvent {
  orderId: number;
  orderGroupId?: string | null;
  transactionRef: string;
}

@Injectable()
export class OrderPaymentListener {
  private readonly logger = new Logger(OrderPaymentListener.name);

  constructor(private readonly orderService: OrderService) {}

  @OnEvent('payment.completed')
  async handlePaymentCompleted(payload: PaymentCompletedEvent): Promise<void> {
    try {
      if (payload.orderGroupId) {
        await this.orderService.markOrderGroupAsPaid(payload.orderGroupId);
        this.logger.log(
          `Order group ${payload.orderGroupId} payment confirmed via ${payload.transactionRef}`,
        );
      } else {
        await this.orderService.markOrderAsPaid(payload.orderId);
        this.logger.log(
          `Order #${payload.orderId} payment confirmed via ${payload.transactionRef}`,
        );
      }
    } catch (error) {
      this.logger.error(`Failed to mark payment as paid: ${error.message}`);
    }
  }
}
