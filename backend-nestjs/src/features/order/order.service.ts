import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DataSource } from 'typeorm';
import { randomUUID } from 'crypto';
import { OrderRepository } from './repositories/order.repository';
import { OrderItemRepository } from './repositories/order-item.repository';
import { OrderStatusHistoryRepository } from './repositories/order-status-history.repository';
import { OrderTrackingLocationRepository } from './repositories/order-tracking-location.repository';
import { CartService } from '../cart/cart.service';
import { ProductService } from '../product/product.service';
import { UserProfileService } from '../user-profile/user-profile.service';
import { CouponService } from '../coupon/coupon.service';
import { distributeCheckoutDiscounts } from './utils/coupon-distribution.util';
import { pickVariantThumbnail } from '../cart/utils/cart.util';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { UpdatePaymentStatusDto } from './dto/update-payment-status.dto';
import { OrderQueryDto } from './dto/order-query.dto';
import {
  OrderResponseDto,
  CheckoutResponseDto,
  CheckoutPreviewResponseDto,
  CheckoutPreviewShopDto,
  AdminOrderResponseDto,
  SellerOrderResponseDto,
  OrderListItemResponseDto,
  OrderListItemWithItemsResponseDto,
} from './dto/order-response.dto';
import { PreviewOrderDto } from './dto/preview-order.dto';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { OrderStatusHistory } from './entities/order-status-history.entity';
import {
  ADMIN_STATUS_TRANSITIONS,
  SELLER_STATUS_TRANSITIONS,
  CUSTOMER_STATUS_TRANSITIONS,
  DEFAULT_SHIPPING_FEE,
  IShippingAddressSnapshot,
} from './types/order.types';
import { ShipperOrderQueryDto } from './dto/shipper-order-query.dto';
import { UpdateShipperLocationDto } from './dto/update-shipper-location.dto';
import {
  OrderTrackingResponseDto,
  StatusHistoryEntryDto,
  ShipperLocationDto,
  DeliveryLocationDto,
} from './dto/order-tracking-response.dto';
import {
  toOrderResponse,
  toOrderListItemResponse,
  toOrderListItemWithItemsResponse,
  toAdminOrderResponse,
  toSellerOrderResponse,
} from './utils/order.util';
import { OrderStatus, PaymentMethod, PaymentStatus } from '../../common/constants';
import { InsufficientStockException } from '../../common/exceptions/insufficient-stock.exception';
import { IPaginatedResult } from '../../common/interfaces/paginated-result.interface';
import { ShopService } from '../shop/shop.service';
import { ActorType } from '../notification/types/notification.types';

@Injectable()
export class OrderService {
  private readonly logger = new Logger(OrderService.name);

  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly orderItemRepository: OrderItemRepository,
    private readonly statusHistoryRepository: OrderStatusHistoryRepository,
    private readonly trackingLocationRepository: OrderTrackingLocationRepository,
    private readonly cartService: CartService,
    private readonly productService: ProductService,
    private readonly userProfileService: UserProfileService,
    private readonly couponService: CouponService,
    private readonly shopService: ShopService,
    private readonly eventEmitter: EventEmitter2,
    private readonly dataSource: DataSource,
  ) { }

  // ─── Customer endpoints ───

  async checkout(
    userId: number,
    dto: CreateOrderDto,
  ): Promise<CheckoutResponseDto> {
    // ── Reads (outside transaction — no locks needed) ──

    const cart = await this.cartService.getCartWithItems(userId);

    for (const item of cart.items) {
      const variant = await this.productService.findVariantById(
        item.product_variant_id,
      );
      if (!variant || variant.stock_quantity < item.quantity) {
        throw new InsufficientStockException(
          variant?.sku || `variant_${item.product_variant_id}`,
        );
      }
    }

    const address = await this.userProfileService.findAddressById(
      userId,
      dto.address_id,
    );
    if (!address) {
      throw new NotFoundException({
        code: 'COMMON_001',
        message: 'Address not found',
      });
    }

    // ── Prepare snapshot data ──

    const shippingSnapshot: IShippingAddressSnapshot = {
      full_name: address.full_name,
      phone: address.phone,
      address_line: address.address_line,
      city: address.city,
      latitude: address.latitude ?? null,
      longitude: address.longitude ?? null,
    };

    let itemsTotal = 0;

    const orderItemsData = cart.items.map((item) => {
      const variant = item.product_variant;
      const product = variant.product;
      const price = Number(variant.sale_price ?? variant.price);
      itemsTotal += price * item.quantity;

      return {
        product_variant_id: variant.id,
        product_name: product?.name ?? '',
        sku: variant.sku,
        price,
        quantity: item.quantity,
        thumbnail_url: pickVariantThumbnail(
          product?.images,
          variant.option1,
          product?.thumbnail_url ?? null,
        ) as string,
        variant_option1_label: product?.option1_label ?? null,
        variant_option1_value: variant.option1 ?? null,
        variant_option2_label: product?.option2_label ?? null,
        variant_option2_value: variant.option2 ?? null,
        shop_id: product?.shop_id ?? null,
        shop_name: product?.shop?.name ?? null,
      };
    });

    // ── Validate shop assignment ──

    for (const item of orderItemsData) {
      if (!item.shop_id || !item.shop_name) {
        throw new BadRequestException({
          code: 'ORDER_002',
          message: `Product "${item.product_name}" is not assigned to any shop`,
        });
      }
    }

    // ── Group items by shop ──

    const shopGroups = new Map<number, { shopName: string; items: typeof orderItemsData }>();
    for (const item of orderItemsData) {
      const shopId = item.shop_id!;
      if (!shopGroups.has(shopId)) {
        shopGroups.set(shopId, { shopName: item.shop_name!, items: [] });
      }
      shopGroups.get(shopId)!.items.push(item);
    }

    // ── Coupon validation + distribution (multi-coupon: ≤1 platform + ≤1/shop) ──

    const couponCodes = this.resolveCouponCodes(dto);
    const couponItems = couponCodes.length
      ? await this.couponService.validateAndCalculateDiscounts(
          userId,
          couponCodes,
          cart.items,
        )
      : [];

    // Gross items subtotal per shop — the input to the discount distributor.
    const shopItemsTotals = new Map<number, number>();
    for (const [shopId, { items }] of shopGroups) {
      shopItemsTotals.set(
        shopId,
        items.reduce((sum, item) => sum + item.price * item.quantity, 0),
      );
    }

    // Shared pure distributor: a shop coupon lands on its own sub-order first,
    // then the platform coupon's share fills each shop's remaining headroom,
    // waterfalling leftover from capped shops to shops that still have room.
    const discountByShop = distributeCheckoutDiscounts(
      shopItemsTotals,
      couponItems,
    );

    const totalDiscount = [...discountByShop.values()].reduce(
      (sum, d) => sum + d.discount,
      0,
    );

    // ── Transaction: create N orders (1 per shop) + items, clear cart ──

    const orderGroupId = randomUUID();
    const shippingFee = DEFAULT_SHIPPING_FEE;
    const createdOrders: Order[] = [];

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Each coupon's global `current_uses` is incremented exactly once per
      // checkout (a platform coupon spans multiple sub-orders).
      const globalIncremented = new Set<number>();

      for (const [shopId, { shopName, items }] of shopGroups) {
        const shopItemsTotal = shopItemsTotals.get(shopId)!;
        const { discount: shopDiscount, couponCode: snapshotCode, usages } =
          discountByShop.get(shopId)!;
        const shopTotal = shopItemsTotal - shopDiscount + shippingFee;

        const order = await queryRunner.manager.save(
          queryRunner.manager.create(Order, {
            user_id: userId,
            shop_id: shopId,
            shop_name: shopName,
            order_group_id: orderGroupId,
            status: OrderStatus.Pending,
            payment_method: dto.payment_method,
            payment_status: PaymentStatus.Unpaid,
            shipping_fee: shippingFee,
            coupon_code: snapshotCode,
            discount_amount: shopDiscount,
            total_amount: shopTotal,
            shipping_address: JSON.stringify(shippingSnapshot),
          }),
        );

        const orderItems = await queryRunner.manager.save(
          queryRunner.manager.create(
            OrderItem,
            items.map((item) => ({ ...item, order_id: order.id })),
          ),
        );
        order.order_items = orderItems;

        // One usage row per coupon that actually discounted this sub-order.
        // Global count is incremented once per coupon per checkout.
        for (const usage of usages) {
          await this.couponService.recordUsage(
            usage.couponId,
            userId,
            order.id,
            usage.amount,
            queryRunner.manager,
            !globalIncremented.has(usage.couponId),
          );
          globalIncremented.add(usage.couponId);
        }

        createdOrders.push(order);
      }

      await this.cartService.clearCart(userId, queryRunner.manager);

      await queryRunner.commitTransaction();

      // ── Side effects (after commit) ──

      for (const order of createdOrders) {
        this.eventEmitter.emit('order.created', {
          orderId: order.id,
          items: order.order_items.map((item) => ({
            productVariantId: item.product_variant_id,
            quantity: item.quantity,
          })),
        });

        const sellerUserIds = await this.resolveSellerUserIdsFromShopIds([
          order.shop_id,
        ]);
        if (sellerUserIds.length > 0) {
          this.eventEmitter.emit('order.placed', {
            orderId: order.id,
            customerId: userId,
            sellerUserIds,
            totalAmount: Number(order.total_amount),
            itemCount: order.order_items.reduce(
              (sum, i) => sum + i.quantity,
              0,
            ),
          });
        }
      }

      const grandTotal = createdOrders.reduce(
        (sum, o) => sum + Number(o.total_amount),
        0,
      );

      this.logger.log(
        `Checkout: ${createdOrders.length} orders created for user ${userId}, group=${orderGroupId}, payment: ${dto.payment_method}${couponItems.length ? `, coupons: [${couponItems.map((c) => c.coupon_code).join(', ')}], discount: ${totalDiscount}` : ''}`,
      );

      return {
        order_group_id: orderGroupId,
        orders: createdOrders.map(toOrderResponse),
        total_amount: grandTotal,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Advisory checkout estimate — exact discount breakdown at the time of the
   * call, computed with the SAME distributor as `checkout` so the numbers match.
   * Read-only: it never writes `coupon_usages`, reserves nothing, and is not a
   * guarantee — `POST /orders` re-validates and is the source of truth.
   */
  async previewCheckout(
    userId: number,
    dto: PreviewOrderDto,
  ): Promise<CheckoutPreviewResponseDto> {
    const cart = await this.cartService.getCartWithItems(userId);

    const empty: CheckoutPreviewResponseDto = {
      subtotal: 0,
      discount_total: 0,
      shipping_total: 0,
      grand_total: 0,
      shops: [],
      applied_coupons: [],
    };
    if (!cart.items || cart.items.length === 0) return empty;

    // Group by shop (skip items with no shop — they can't form a valid order).
    const shopGroups = new Map<number, { shopName: string; itemsTotal: number }>();
    for (const item of cart.items) {
      const variant = item.product_variant;
      const product = variant.product;
      const shopId = product?.shop_id;
      if (shopId == null) continue;
      const line = Number(variant.sale_price ?? variant.price) * item.quantity;
      const group = shopGroups.get(shopId);
      if (group) {
        group.itemsTotal += line;
      } else {
        shopGroups.set(shopId, {
          shopName: product?.shop?.name ?? '',
          itemsTotal: line,
        });
      }
    }
    if (shopGroups.size === 0) return empty;

    const couponCodes = this.resolveCouponCodes(dto);
    const couponItems = couponCodes.length
      ? await this.couponService.validateAndCalculateDiscounts(
          userId,
          couponCodes,
          cart.items,
        )
      : [];

    const shopItemsTotals = new Map<number, number>();
    for (const [shopId, group] of shopGroups) {
      shopItemsTotals.set(shopId, group.itemsTotal);
    }

    const discountByShop = distributeCheckoutDiscounts(
      shopItemsTotals,
      couponItems,
    );

    const shippingFee = DEFAULT_SHIPPING_FEE;
    const shops: CheckoutPreviewShopDto[] = [];
    let subtotal = 0;
    let discountTotal = 0;
    let shippingTotal = 0;

    for (const [shopId, group] of shopGroups) {
      const d = discountByShop.get(shopId)!;
      const total = group.itemsTotal - d.discount + shippingFee;
      subtotal += group.itemsTotal;
      discountTotal += d.discount;
      shippingTotal += shippingFee;
      shops.push({
        shop_id: shopId,
        shop_name: group.shopName,
        items_total: group.itemsTotal,
        discount_amount: d.discount,
        shipping_fee: shippingFee,
        total,
        coupons: d.usages.map((u) => ({
          code: u.couponCode,
          discount_amount: u.amount,
        })),
      });
    }

    // Per-coupon totals across the whole cart.
    const perCoupon = new Map<string, number>();
    for (const [, d] of discountByShop) {
      for (const u of d.usages) {
        perCoupon.set(u.couponCode, (perCoupon.get(u.couponCode) ?? 0) + u.amount);
      }
    }

    return {
      subtotal,
      discount_total: discountTotal,
      shipping_total: shippingTotal,
      grand_total: subtotal - discountTotal + shippingTotal,
      shops,
      applied_coupons: [...perCoupon.entries()].map(([code, discount_amount]) => ({
        code,
        discount_amount,
      })),
    };
  }

  async findMyOrders(
    userId: number,
    query: OrderQueryDto,
  ): Promise<IPaginatedResult<OrderListItemWithItemsResponseDto>> {
    const result = await this.orderRepository.findByUserIdPaginated(
      userId,
      query.page || 1,
      query.limit || 20,
      query.sort,
      query.order,
      query.status,
    );

    return {
      data: result.data.map(toOrderListItemWithItemsResponse),
      meta: result.meta,
    };
  }

  async findMyOrderById(
    userId: number,
    orderId: number,
  ): Promise<OrderResponseDto> {
    const order = await this.orderRepository.findByIdWithItems(orderId);
    if (!order) {
      throw new NotFoundException({
        code: 'ORDER_001',
        message: 'Order not found',
      });
    }

    if (order.user_id !== userId) {
      throw new ForbiddenException({
        code: 'ORDER_004',
        message: 'Order does not belong to user',
      });
    }

    const dto = toOrderResponse(order);
    dto.applied_coupons = await this.couponService.getUsagesForOrder(order.id);
    return dto;
  }

  async findMyOrdersByGroupId(
    userId: number,
    groupId: string,
  ): Promise<OrderResponseDto[]> {
    const orders = await this.orderRepository.findByGroupIdAndUserId(
      groupId,
      userId,
    );
    if (orders.length === 0) {
      throw new NotFoundException({
        code: 'ORDER_001',
        message: 'Order group not found',
      });
    }
    return Promise.all(
      orders.map(async (order) => {
        const dto = toOrderResponse(order);
        dto.applied_coupons = await this.couponService.getUsagesForOrder(
          order.id,
        );
        return dto;
      }),
    );
  }

  async confirmReceipt(
    userId: number,
    orderId: number,
  ): Promise<OrderResponseDto> {
    const order = await this.orderRepository.findByIdWithItems(orderId);
    if (!order) {
      throw new NotFoundException({
        code: 'ORDER_001',
        message: 'Order not found',
      });
    }

    if (order.user_id !== userId) {
      throw new ForbiddenException({
        code: 'ORDER_004',
        message: 'Order does not belong to user',
      });
    }

    if (order.status !== OrderStatus.Delivered) {
      throw new BadRequestException({
        code: 'ORDER_005',
        message: 'Order has already been completed or is not in delivered status',
      });
    }

    await this.orderRepository.updateStatus(orderId, OrderStatus.Completed);
    const oldStatus = order.status;
    order.status = OrderStatus.Completed;

    const sellerUserIds = await this.resolveSellerUserIdsFromShopIds([order.shop_id]);

    this.eventEmitter.emit('order.status_updated', {
      orderId: order.id,
      userId: order.user_id,
      notifyUserIds: sellerUserIds,
      oldStatus,
      newStatus: OrderStatus.Completed,
      actorType: ActorType.Customer,
      actorId: userId,
    });

    this.logger.log(`Order #${orderId} receipt confirmed by user ${userId}`);

    return toOrderResponse(order);
  }

  async requestReturn(
    userId: number,
    orderId: number,
  ): Promise<OrderResponseDto> {
    const order = await this.orderRepository.findByIdWithItems(orderId);
    if (!order) {
      throw new NotFoundException({
        code: 'ORDER_001',
        message: 'Order not found',
      });
    }

    if (order.user_id !== userId) {
      throw new ForbiddenException({
        code: 'ORDER_004',
        message: 'Order does not belong to user',
      });
    }

    if (order.status !== OrderStatus.Delivered) {
      throw new BadRequestException({
        code: 'ORDER_005',
        message: 'Order has already been completed or is not in delivered status',
      });
    }

    await this.orderRepository.updateStatus(orderId, OrderStatus.ReturnRequested);
    const oldStatus = order.status;
    order.status = OrderStatus.ReturnRequested;

    const sellerUserIds = await this.resolveSellerUserIdsFromShopIds([order.shop_id]);

    this.eventEmitter.emit('order.status_updated', {
      orderId: order.id,
      userId: order.user_id,
      notifyUserIds: sellerUserIds,
      oldStatus,
      newStatus: OrderStatus.ReturnRequested,
      actorType: ActorType.Customer,
      actorId: userId,
    });

    this.logger.log(`Order #${orderId} return requested by user ${userId}`);

    return toOrderResponse(order);
  }

  async cancelOrder(
    userId: number,
    orderId: number,
  ): Promise<OrderResponseDto> {
    const order = await this.orderRepository.findByIdWithItems(orderId);
    if (!order) {
      throw new NotFoundException({
        code: 'ORDER_001',
        message: 'Order not found',
      });
    }

    if (order.user_id !== userId) {
      throw new ForbiddenException({
        code: 'ORDER_004',
        message: 'Order does not belong to user',
      });
    }

    if (order.status !== OrderStatus.Pending) {
      throw new BadRequestException({
        code: 'ORDER_003',
        message: 'Invalid status transition',
      });
    }

    const oldStatus = order.status;
    await this.orderRepository.updateStatus(orderId, OrderStatus.Cancelled);
    order.status = OrderStatus.Cancelled;

    await this.handleCouponReversalOnCancel(order);

    this.eventEmitter.emit('order.cancelled', {
      orderId: order.id,
      items: order.order_items.map((item) => ({
        productVariantId: item.product_variant_id,
        quantity: item.quantity,
      })),
    });

    const sellerUserIds = await this.resolveSellerUserIdsFromShopIds([order.shop_id]);
    if (sellerUserIds.length > 0) {
      this.eventEmitter.emit('order.status_updated', {
        orderId: order.id,
        userId: order.user_id,
        notifyUserIds: sellerUserIds,
        oldStatus,
        newStatus: OrderStatus.Cancelled,
        actorType: ActorType.Customer,
        actorId: userId,
      });
    }

    this.logger.log(`Order #${orderId} cancelled by user ${userId}`);

    return toOrderResponse(order);
  }

  // ─── Admin endpoints ───

  async findAllOrders(
    query: OrderQueryDto,
  ): Promise<IPaginatedResult<OrderListItemResponseDto>> {
    const result = await this.orderRepository.findAllPaginated(query);

    return {
      data: result.data.map(toOrderListItemResponse),
      meta: result.meta,
    };
  }

  async findOrderById(orderId: number): Promise<AdminOrderResponseDto> {
    const order = await this.orderRepository.findByIdWithItemsAndUser(orderId);
    if (!order) {
      throw new NotFoundException({
        code: 'ORDER_001',
        message: 'Order not found',
      });
    }

    const dto = toAdminOrderResponse(order);
    dto.applied_coupons = await this.couponService.getUsagesForOrder(order.id);
    return dto;
  }

  async updateOrderStatus(
    orderId: number,
    dto: UpdateOrderStatusDto,
    adminId?: number,
  ): Promise<AdminOrderResponseDto> {
    const order = await this.orderRepository.findByIdWithItemsAndUser(orderId);
    if (!order) {
      throw new NotFoundException({
        code: 'ORDER_001',
        message: 'Order not found',
      });
    }

    const oldStatus = order.status;
    const allowedTransitions = ADMIN_STATUS_TRANSITIONS[order.status] || [];
    if (!allowedTransitions.includes(dto.status)) {
      throw new BadRequestException({
        code: 'ORDER_003',
        message: `Invalid status transition from ${order.status} to ${dto.status}`,
      });
    }

    if (
      dto.status === OrderStatus.Delivered &&
      order.payment_method !== PaymentMethod.Cod &&
      order.payment_status === 'unpaid'
    ) {
      throw new BadRequestException({
        code: 'ORDER_003',
        message: 'Order must be paid before marking as delivered',
      });
    }

    if (dto.status === OrderStatus.Delivered) {
      await this.orderRepository.updateStatusWithDeliveredAt(
        orderId,
        dto.status,
        new Date(),
      );
    } else {
      await this.orderRepository.updateStatus(orderId, dto.status);
    }
    order.status = dto.status;

    if (dto.status === OrderStatus.Cancelled) {
      await this.handleCouponReversalOnCancel(order);

      this.eventEmitter.emit('order.cancelled', {
        orderId: order.id,
        items: order.order_items.map((item) => ({
          productVariantId: item.product_variant_id,
          quantity: item.quantity,
        })),
      });
    }

    this.eventEmitter.emit('order.status_updated', {
      orderId: order.id,
      userId: order.user_id,
      notifyUserIds: [order.user_id],
      oldStatus,
      newStatus: dto.status,
      actorType: ActorType.Admin,
      actorId: adminId,
    });

    this.logger.log(`Order #${orderId} status updated to ${dto.status}`);

    return toAdminOrderResponse(order);
  }

  async updatePaymentStatus(
    orderId: number,
    dto: UpdatePaymentStatusDto,
  ): Promise<AdminOrderResponseDto> {
    const order = await this.orderRepository.findByIdWithItemsAndUser(orderId);
    if (!order) {
      throw new NotFoundException({
        code: 'ORDER_001',
        message: 'Order not found',
      });
    }

    if (
      order.status === OrderStatus.Cancelled ||
      order.status === OrderStatus.ReturnRequested
    ) {
      throw new BadRequestException({
        code: 'ORDER_003',
        message: `Cannot update payment status of a ${order.status} order`,
      });
    }

    if (
      order.payment_method === PaymentMethod.Cod &&
      (order.status === OrderStatus.Pending || order.status === OrderStatus.Confirmed)
    ) {
      throw new BadRequestException({
        code: 'ORDER_003',
        message: 'COD orders can only be marked as paid during shipping or after delivery',
      });
    }

    await this.orderRepository.updatePaymentStatus(orderId, dto.payment_status);
    order.payment_status = dto.payment_status;

    this.logger.log(
      `Order #${orderId} payment status updated to ${dto.payment_status}`,
    );

    return toAdminOrderResponse(order);
  }

  // ─── Seller endpoints ───

  async findSellerOrders(
    userId: number,
    query: OrderQueryDto,
  ): Promise<IPaginatedResult<OrderListItemResponseDto>> {
    const shop = await this.shopService.resolveShopByUserId(userId);
    const result = await this.orderRepository.findByShopIdPaginated(shop.id, query);

    return {
      data: result.data.map(toOrderListItemResponse),
      meta: result.meta,
    };
  }

  async findSellerOrderById(
    userId: number,
    orderId: number,
  ): Promise<SellerOrderResponseDto> {
    const shop = await this.shopService.resolveShopByUserId(userId);
    const order = await this.orderRepository.findByIdWithItemsForShop(orderId, shop.id);
    if (!order) {
      throw new NotFoundException({
        code: 'ORDER_001',
        message: 'Order not found',
      });
    }

    const dto = toSellerOrderResponse(order);
    dto.applied_coupons = await this.couponService.getUsagesForOrder(order.id);
    return dto;
  }

  async updateSellerOrderStatus(
    userId: number,
    orderId: number,
    dto: UpdateOrderStatusDto,
  ): Promise<SellerOrderResponseDto> {
    const shop = await this.shopService.resolveShopByUserId(userId);
    const order = await this.orderRepository.findByIdWithItemsForShop(orderId, shop.id);
    if (!order) {
      throw new NotFoundException({
        code: 'ORDER_001',
        message: 'Order not found',
      });
    }

    const oldStatus = order.status;
    const allowedTransitions = SELLER_STATUS_TRANSITIONS[order.status] || [];
    if (!allowedTransitions.includes(dto.status)) {
      throw new BadRequestException({
        code: 'ORDER_003',
        message: `Invalid status transition from ${order.status} to ${dto.status}.`,
      });
    }

    if (dto.status === OrderStatus.Delivered) {
      await this.orderRepository.updateStatusWithDeliveredAt(
        orderId,
        dto.status,
        new Date(),
      );
    } else {
      await this.orderRepository.updateStatus(orderId, dto.status);
    }
    order.status = dto.status;

    this.eventEmitter.emit('order.status_updated', {
      orderId: order.id,
      userId: order.user_id,
      notifyUserIds: [order.user_id],
      oldStatus,
      newStatus: dto.status,
      actorType: ActorType.Seller,
      actorId: userId,
    });

    this.logger.log(
      `Order #${orderId} status updated to ${dto.status} by seller ${userId}`,
    );

    return toSellerOrderResponse(order);
  }

  async updateSellerPaymentStatus(
    userId: number,
    orderId: number,
    dto: UpdatePaymentStatusDto,
  ): Promise<SellerOrderResponseDto> {
    const shop = await this.shopService.resolveShopByUserId(userId);
    const order = await this.orderRepository.findByIdWithItemsForShop(orderId, shop.id);
    if (!order) {
      throw new NotFoundException({
        code: 'ORDER_001',
        message: 'Order not found',
      });
    }

    if (
      order.status === OrderStatus.Cancelled ||
      order.status === OrderStatus.ReturnRequested
    ) {
      throw new BadRequestException({
        code: 'ORDER_003',
        message: `Cannot update payment status of a ${order.status} order`,
      });
    }

    if (
      order.payment_method === PaymentMethod.Cod &&
      (order.status === OrderStatus.Pending || order.status === OrderStatus.Confirmed)
    ) {
      throw new BadRequestException({
        code: 'ORDER_003',
        message: 'COD orders can only be marked as paid during shipping or after delivery',
      });
    }

    await this.orderRepository.updatePaymentStatus(orderId, dto.payment_status);
    order.payment_status = dto.payment_status;

    this.logger.log(
      `Order #${orderId} payment status updated to ${dto.payment_status} by seller ${userId}`,
    );

    return toSellerOrderResponse(order);
  }

  // ─── Shipper endpoints ───

  async findShipperOrders(
    userId: number,
    query: ShipperOrderQueryDto,
  ): Promise<IPaginatedResult<OrderListItemResponseDto>> {
    const result =
      query.filter === 'my_deliveries'
        ? await this.orderRepository.findByShipperIdPaginated(userId, query)
        : await this.orderRepository.findAvailableForShipperPaginated(query);

    return {
      data: result.data.map(toOrderListItemResponse),
      meta: result.meta,
    };
  }

  async findShipperOrderById(
    userId: number,
    orderId: number,
  ): Promise<AdminOrderResponseDto> {
    const order = await this.orderRepository.findByIdWithItemsAndUser(orderId);
    if (!order) {
      throw new NotFoundException({
        code: 'ORDER_001',
        message: 'Order not found',
      });
    }

    const isAssigned = order.shipper_id === userId;
    const isAvailable =
      order.status === OrderStatus.Confirmed && order.shipper_id === null;

    if (!isAssigned && !isAvailable) {
      throw new NotFoundException({
        code: 'ORDER_001',
        message: 'Order not found',
      });
    }

    return toAdminOrderResponse(order);
  }

  async acceptOrder(
    userId: number,
    orderId: number,
  ): Promise<AdminOrderResponseDto> {
    const result = await this.orderRepository.atomicAssignShipper(
      orderId,
      userId,
    );

    if (result.affected === 0) {
      throw new BadRequestException({
        code: 'ORDER_003',
        message:
          'Order already assigned to another shipper or not in confirmed status',
      });
    }

    const order = await this.orderRepository.findByIdWithItemsAndUser(orderId);

    this.eventEmitter.emit('order.status_updated', {
      orderId: order!.id,
      userId: order!.user_id,
      notifyUserIds: [order!.user_id],
      oldStatus: OrderStatus.Confirmed,
      newStatus: OrderStatus.Shipping,
      actorType: ActorType.Shipper,
      actorId: userId,
    });

    this.logger.log(
      `Order #${orderId} accepted by shipper ${userId}`,
    );

    return toAdminOrderResponse(order!);
  }

  async markDelivered(
    userId: number,
    orderId: number,
  ): Promise<AdminOrderResponseDto> {
    const order = await this.orderRepository.findByIdWithItemsAndUser(orderId);
    if (!order) {
      throw new NotFoundException({
        code: 'ORDER_001',
        message: 'Order not found',
      });
    }

    if (order.shipper_id !== userId) {
      throw new ForbiddenException({
        code: 'ORDER_004',
        message: 'Order does not belong to user',
      });
    }

    if (order.status !== OrderStatus.Shipping) {
      throw new BadRequestException({
        code: 'ORDER_003',
        message: 'Invalid status transition',
      });
    }

    if (
      order.payment_method !== PaymentMethod.Cod &&
      order.payment_status === PaymentStatus.Unpaid
    ) {
      throw new BadRequestException({
        code: 'ORDER_003',
        message: 'Order must be paid before marking as delivered',
      });
    }

    const oldStatus = order.status;
    await this.orderRepository.updateStatusWithDeliveredAt(
      orderId,
      OrderStatus.Delivered,
      new Date(),
    );
    order.status = OrderStatus.Delivered;

    this.eventEmitter.emit('order.status_updated', {
      orderId: order.id,
      userId: order.user_id,
      notifyUserIds: [order.user_id],
      oldStatus,
      newStatus: OrderStatus.Delivered,
      actorType: ActorType.Shipper,
      actorId: userId,
    });

    this.logger.log(
      `Order #${orderId} marked as delivered by shipper ${userId}`,
    );

    return toAdminOrderResponse(order);
  }

  // ─── Cross-feature: consumed by review ───

  async findOrderByIdForReview(orderId: number): Promise<Order | null> {
    return this.orderRepository.findByIdWithItems(orderId);
  }

  async findOrderForPayment(
    orderId: number,
    userId: number,
  ): Promise<Order | null> {
    return this.orderRepository.findByIdAndUserId(orderId, userId);
  }

  // Privileged (admin) lookup — no owner scope. Used by the payment feature so
  // admins can view an order's transactions without being the order owner.
  async findOrderForPaymentAdmin(orderId: number): Promise<Order | null> {
    return this.orderRepository.findByIdWithItems(orderId);
  }

  async findOrdersByGroupIdForPayment(
    groupId: string,
    userId: number,
  ): Promise<Order[]> {
    return this.orderRepository.findByGroupIdAndUserId(groupId, userId);
  }

  async markOrderAsPaid(orderId: number): Promise<void> {
    await this.orderRepository.updatePaymentStatus(orderId, PaymentStatus.Paid);
    this.logger.log(`Order #${orderId} marked as paid via payment gateway`);
  }

  async markOrderGroupAsPaid(orderGroupId: string): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const orders = await manager.find(Order, {
        where: { order_group_id: orderGroupId },
      });

      for (const order of orders) {
        if (order.status !== OrderStatus.Cancelled) {
          await manager.update(Order, order.id, {
            payment_status: PaymentStatus.Paid,
          });
        }
      }
    });
    this.logger.log(
      `Order group ${orderGroupId} marked as paid via payment gateway`,
    );
  }

  // ─── Order Tracking ───

  async getOrderTracking(
    userId: number,
    orderId: number,
  ): Promise<OrderTrackingResponseDto> {
    const order = await this.orderRepository.findByIdWithItems(orderId);
    if (!order) {
      throw new NotFoundException({
        code: 'ORDER_001',
        message: 'Order not found',
      });
    }

    if (order.user_id !== userId) {
      throw new ForbiddenException({
        code: 'ORDER_004',
        message: 'Order does not belong to user',
      });
    }

    const history =
      await this.statusHistoryRepository.findByOrderId(orderId);

    const timeline = this.mapHistoryToTimeline(history);
    const shipperLocation = await this.resolveShipperLocation(order.status, orderId);
    const deliveryLocation = this.resolveDeliveryLocation(order.shipping_address);

    return { timeline, shipperLocation, deliveryLocation };
  }

  async getOrderTrackingForRole(
    orderId: number,
  ): Promise<OrderTrackingResponseDto> {
    const order = await this.orderRepository.findByIdWithItems(orderId);
    if (!order) {
      throw new NotFoundException({
        code: 'ORDER_001',
        message: 'Order not found',
      });
    }

    const history =
      await this.statusHistoryRepository.findByOrderId(orderId);

    const timeline = this.mapHistoryToTimeline(history);
    const shipperLocation = await this.resolveShipperLocation(order.status, orderId);
    const deliveryLocation = this.resolveDeliveryLocation(order.shipping_address);

    return { timeline, shipperLocation, deliveryLocation };
  }

  async updateShipperLocation(
    userId: number,
    orderId: number,
    dto: UpdateShipperLocationDto,
  ): Promise<void> {
    const order = await this.orderRepository.findByIdWithItems(orderId);
    if (!order) {
      throw new NotFoundException({
        code: 'ORDER_001',
        message: 'Order not found',
      });
    }

    if (order.shipper_id !== userId) {
      throw new ForbiddenException({
        code: 'ORDER_004',
        message: 'Order does not belong to user',
      });
    }

    if (order.status !== OrderStatus.Shipping) {
      throw new BadRequestException({
        code: 'ORDER_003',
        message: 'Can only update location for orders in shipping status',
      });
    }

    const latest =
      await this.trackingLocationRepository.findLatestByOrderId(orderId);
    if (latest) {
      const elapsed = Date.now() - latest.created_at.getTime();
      if (elapsed < 30_000) {
        throw new BadRequestException({
          code: 'ORDER_003',
          message: 'Please wait 30 seconds between location updates',
        });
      }
    }

    await this.trackingLocationRepository.insertLocation(
      orderId,
      dto.latitude,
      dto.longitude,
    );

    this.logger.log(
      `Shipper ${userId} updated location for order #${orderId}: ${dto.latitude}, ${dto.longitude}`,
    );
  }

  // ─── Private helpers ───

  /**
   * Normalises the checkout coupon input into a deduped, upper-cased list.
   * Accepts the new `coupon_codes[]` and falls back to the legacy single
   * `coupon_code` for backward compatibility.
   */
  private resolveCouponCodes(dto: {
    coupon_code?: string;
    coupon_codes?: string[];
  }): string[] {
    const raw =
      dto.coupon_codes && dto.coupon_codes.length
        ? dto.coupon_codes
        : dto.coupon_code
          ? [dto.coupon_code]
          : [];
    return [...new Set(raw.map((c) => c.toUpperCase().trim()).filter(Boolean))];
  }

  private async handleCouponReversalOnCancel(order: Order): Promise<void> {
    // A shop coupon only affects its own sub-order → reverse it as soon as that
    // sub-order is cancelled.
    await this.couponService.reverseOrderShopCoupons(order.id);

    // A platform coupon spans the whole group → reverse only when every order
    // in the group is cancelled.
    const allCancelled = await this.orderRepository.areAllGroupOrdersCancelled(
      order.order_group_id,
    );
    if (allCancelled) {
      await this.couponService.reverseGroupPlatformCoupon(order.order_group_id);
    }
  }

  private mapHistoryToTimeline(
    history: OrderStatusHistory[],
  ): StatusHistoryEntryDto[] {
    return history.map((h) => ({
      fromStatus: h.from_status,
      toStatus: h.to_status,
      actorId: h.actor_id,
      actorType: h.actor_type,
      actorName: h.actor?.full_name ?? null,
      note: h.note,
      createdAt: h.created_at,
    }));
  }

  private async resolveShipperLocation(
    status: string,
    orderId: number,
  ): Promise<ShipperLocationDto | null> {
    const statusesWithLocation = [
      OrderStatus.Shipping,
      OrderStatus.Delivered,
      OrderStatus.Completed,
      OrderStatus.ReturnRequested,
    ];
    if (!statusesWithLocation.includes(status as OrderStatus)) return null;

    const latest =
      await this.trackingLocationRepository.findLatestByOrderId(orderId);
    if (!latest) return null;

    return {
      latitude: Number(latest.latitude),
      longitude: Number(latest.longitude),
      createdAt: latest.created_at,
    };
  }

  private resolveDeliveryLocation(
    shippingAddress: string,
  ): DeliveryLocationDto | null {
    try {
      const addr: IShippingAddressSnapshot = JSON.parse(shippingAddress);
      if (addr.latitude && addr.longitude) {
        return {
          latitude: Number(addr.latitude),
          longitude: Number(addr.longitude),
          label: `${addr.address_line}, ${addr.city}`,
        };
      }
    } catch {
      // Malformed JSON — skip
    }
    return null;
  }

  private async resolveSellerUserIdsFromShopIds(shopIds: number[]): Promise<number[]> {
    const userIds: number[] = [];
    for (const shopId of shopIds) {
      try {
        const shop = await this.shopService.findShopById(shopId);
        userIds.push(shop.user_id);
      } catch {
        // Shop may have been deleted — skip notification
      }
    }
    return userIds;
  }
}
