export class OrderCreatedItem {
  productVariantId: number;
  quantity: number;
}

export class OrderCreatedEvent {
  orderId: number;
  items: OrderCreatedItem[];
  // Buyer id — used by Smart Recommendations (Module 22) to log PURCHASE signals.
  // Optional/backward-compatible: ProductService.handleOrderCreated ignores it.
  userId?: number;
}

export class OrderCancelledEvent {
  orderId: number;
  items: OrderCreatedItem[];
}
