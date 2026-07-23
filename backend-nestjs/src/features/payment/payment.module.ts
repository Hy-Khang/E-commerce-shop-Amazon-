import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { VnpayService } from './vnpay.service';
import { MomoService } from './momo.service';
import { PaymentTransaction } from './entities/payment-transaction.entity';
import { PaymentTransactionRepository } from './repositories/payment-transaction.repository';
import { OrderModule } from '../order/order.module';

@Module({
  imports: [TypeOrmModule.forFeature([PaymentTransaction]), OrderModule],
  controllers: [PaymentController],
  providers: [
    PaymentService,
    VnpayService,
    MomoService,
    PaymentTransactionRepository,
  ],
  exports: [PaymentService],
})
export class PaymentModule {}
