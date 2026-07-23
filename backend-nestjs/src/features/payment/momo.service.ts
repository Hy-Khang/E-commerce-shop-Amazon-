import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac } from 'crypto';
import {
  IMomoCreateResponse,
  IMomoIpnPayload,
} from './types/payment.types';

@Injectable()
export class MomoService {
  private readonly logger = new Logger(MomoService.name);
  private readonly partnerCode: string;
  private readonly accessKey: string;
  private readonly secretKey: string;
  private readonly endpoint: string;
  private readonly returnUrl: string;
  private readonly ipnUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.partnerCode = this.configService.get<string>('momo.partnerCode', '');
    this.accessKey = this.configService.get<string>('momo.accessKey', '');
    this.secretKey = this.configService.get<string>('momo.secretKey', '');
    this.endpoint = this.configService.get<string>('momo.endpoint', '');
    this.returnUrl = this.configService.get<string>('momo.returnUrl', '');
    this.ipnUrl = this.configService.get<string>('momo.ipnUrl', '');
  }

  async createPayment(
    transactionRef: string,
    amount: number,
    orderInfo: string,
  ): Promise<IMomoCreateResponse> {
    const requestId = transactionRef;
    const extraData = '';
    const requestType = 'payWithMethod';

    const rawSignature = [
      `accessKey=${this.accessKey}`,
      `amount=${amount}`,
      `extraData=${extraData}`,
      `ipnUrl=${this.ipnUrl}`,
      `orderId=${transactionRef}`,
      `orderInfo=${orderInfo}`,
      `partnerCode=${this.partnerCode}`,
      `redirectUrl=${this.returnUrl}`,
      `requestId=${requestId}`,
      `requestType=${requestType}`,
    ].join('&');

    const signature = createHmac('sha256', this.secretKey)
      .update(rawSignature)
      .digest('hex');

    const body = {
      partnerCode: this.partnerCode,
      accessKey: this.accessKey,
      requestId,
      amount,
      orderId: transactionRef,
      orderInfo,
      redirectUrl: this.returnUrl,
      ipnUrl: this.ipnUrl,
      extraData,
      requestType,
      signature,
      lang: 'vi',
    };

    this.logger.log(`MoMo payment request for txnRef: ${transactionRef}`);

    const response = await fetch(this.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    return response.json() as Promise<IMomoCreateResponse>;
  }

  verifyIpnSignature(payload: IMomoIpnPayload): boolean {
    const rawSignature = [
      `accessKey=${this.accessKey}`,
      `amount=${payload.amount}`,
      `extraData=${payload.extraData}`,
      `message=${payload.message}`,
      `orderId=${payload.orderId}`,
      `orderInfo=${payload.orderInfo}`,
      `orderType=${payload.orderType}`,
      `partnerCode=${payload.partnerCode}`,
      `payType=${payload.payType}`,
      `requestId=${payload.requestId}`,
      `responseTime=${payload.responseTime}`,
      `resultCode=${payload.resultCode}`,
      `transId=${payload.transId}`,
    ].join('&');

    const expectedSignature = createHmac('sha256', this.secretKey)
      .update(rawSignature)
      .digest('hex');

    return payload.signature === expectedSignature;
  }
}
