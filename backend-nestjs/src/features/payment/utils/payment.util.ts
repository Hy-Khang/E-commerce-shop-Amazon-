import { randomBytes } from 'crypto';

export function generateTransactionRef(orderId: number): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = randomBytes(4).toString('hex').toUpperCase();
  return `ORD${orderId}T${timestamp}R${random}`;
}

export function formatVnpayDate(date: Date): string {
  const gmt7 = new Date(date.getTime() + 7 * 60 * 60 * 1000);
  const y = gmt7.getUTCFullYear().toString();
  const m = (gmt7.getUTCMonth() + 1).toString().padStart(2, '0');
  const d = gmt7.getUTCDate().toString().padStart(2, '0');
  const h = gmt7.getUTCHours().toString().padStart(2, '0');
  const mi = gmt7.getUTCMinutes().toString().padStart(2, '0');
  const s = gmt7.getUTCSeconds().toString().padStart(2, '0');
  return `${y}${m}${d}${h}${mi}${s}`;
}
