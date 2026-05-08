import { BadRequestException } from '@nestjs/common';

export class CartEmptyException extends BadRequestException {
  constructor() {
    super({ code: 'CART_002', message: 'Cart is empty' });
  }
}
