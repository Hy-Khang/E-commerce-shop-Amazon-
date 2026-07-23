import { registerAs } from '@nestjs/config';

export default registerAs('momo', () => ({
  partnerCode: process.env.MOMO_PARTNER_CODE || '',
  accessKey: process.env.MOMO_ACCESS_KEY || '',
  secretKey: process.env.MOMO_SECRET_KEY || '',
  endpoint:
    process.env.MOMO_ENDPOINT ||
    'https://test-payment.momo.vn/v2/gateway/api/create',
  returnUrl:
    process.env.MOMO_RETURN_URL ||
    'http://localhost:3000/api/v1/payments/momo/return',
  ipnUrl:
    process.env.MOMO_IPN_URL ||
    'http://localhost:3000/api/v1/payments/momo/ipn',
}));
