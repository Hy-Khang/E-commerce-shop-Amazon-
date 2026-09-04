import { BadRequestException } from '@nestjs/common';

export class InsufficientStockException extends BadRequestException {
  constructor(sku: string) {
    super({
      code: 'ORDER_002',
      message: `Insufficient stock for variant ${sku}`,
    });
  }
}
