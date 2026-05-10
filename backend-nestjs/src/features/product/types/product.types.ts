export class OrderCreatedItem {
  productVariantId: number;
  quantity: number;
}

export class OrderCreatedEvent {
  orderId: number;
  items: OrderCreatedItem[];
}

export class OrderCancelledEvent {
  orderId: number;
  items: OrderCreatedItem[];
}
