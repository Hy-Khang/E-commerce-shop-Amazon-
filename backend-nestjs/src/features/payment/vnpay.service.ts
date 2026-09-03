import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac } from 'crypto';
import { IVnpayParams } from './types/payment.types';
import { formatVnpayDate } from './utils/payment.util';

@Injectable()
export class VnpayService {
  private readonly logger = new Logger(VnpayService.name);
  private readonly tmnCode: string;
  private readonly hashSecret: string;
  private readonly paymentUrl: string;
  private readonly returnUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.tmnCode = this.configService.get<string>('vnpay.tmnCode', '');
    this.hashSecret = this.configService.get<string>('vnpay.hashSecret', '');
    this.paymentUrl = this.configService.get<string>('vnpay.paymentUrl', '');
    this.returnUrl = this.configService.get<string>('vnpay.returnUrl', '');
  }

  createPaymentUrl(
    transactionRef: string,
    amount: number,
    orderInfo: string,
    ipAddress: string,
  ): string {
    const now = new Date();
    const normalizedIp = this.normalizeIpAddress(ipAddress);
    const sanitizedOrderInfo = this.sanitizeOrderInfo(orderInfo);

    const params: IVnpayParams = {
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode: this.tmnCode,
      vnp_Locale: 'vn',
      vnp_CurrCode: 'VND',
      vnp_TxnRef: transactionRef,
      vnp_OrderInfo: sanitizedOrderInfo,
      vnp_OrderType: 'other',
      vnp_Amount: Math.round(amount * 100),
      vnp_ReturnUrl: this.returnUrl,
      vnp_IpAddr: normalizedIp,
      vnp_CreateDate: formatVnpayDate(now),
    };

    const sortedParams = this.sortParams(params);
    const signData = new URLSearchParams(sortedParams).toString();
    const secureHash = createHmac('sha512', this.hashSecret)
      .update(signData)
      .digest('hex');

    const paymentUrlWithParams = `${this.paymentUrl}?${signData}&vnp_SecureHash=${secureHash}`;
    this.logger.log(
      `VNPay payment URL created for txnRef: ${transactionRef}, amount: ${params.vnp_Amount}, createDate: ${params.vnp_CreateDate}, ip: ${normalizedIp}`,
    );
    this.logger.debug(`VNPay full URL: ${paymentUrlWithParams}`);
    return paymentUrlWithParams;
  }

  verifyIpnSignature(query: Record<string, string>): boolean {
    const secureHash = query['vnp_SecureHash'];
    if (!secureHash) return false;

    const params = { ...query };
    delete params['vnp_SecureHash'];
    delete params['vnp_SecureHashType'];

    const sortedParams = this.sortParams(params);
    const signData = new URLSearchParams(sortedParams).toString();
    const checkHash = createHmac('sha512', this.hashSecret)
      .update(signData)
      .digest('hex');

    return secureHash === checkHash;
  }

  private sortParams(
    params: Record<string, string | number | undefined>,
  ): Record<string, string> {
    const sorted: Record<string, string> = {};
    const keys = Object.keys(params)
      .filter((k) => params[k] !== undefined && params[k] !== '')
      .sort();
    for (const key of keys) {
      sorted[key] = String(params[key]);
    }
    return sorted;
  }

  private normalizeIpAddress(ip: string): string {
    if (ip === '::1') return '127.0.0.1';
    if (ip.startsWith('::ffff:')) return ip.slice(7);
    return ip;
  }

  private sanitizeOrderInfo(info: string): string {
    return info.replace(/[^a-zA-Z0-9 ]/g, '');
  }
}
