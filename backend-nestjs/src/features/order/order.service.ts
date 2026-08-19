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
import { ICouponCalculationItem } from '../coupon/types/coupon.types';
import { pickVariantThumbnail } from '../cart/utils/cart.util';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { UpdatePaymentStatusDto } from './dto/update-payment-status.dto';
import { OrderQueryDto } from './dto/order-query.dto';
import {
  OrderResponseDto,
  CheckoutResponseDto,
  AdminOrderResponseDto,
  SellerOrderResponseDto,
  OrderListItemResponseDto,
  OrderListItemWithItemsResponseDto,
} from './dto/order-response.dto';
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

    // ── Coupon validation (multi-coupon: ≤1 platform + ≤1 per shop) ──

    const couponCodes = this.resolveCouponCodes(dto);
    const couponItems = couponCodes.length
      ? await this.couponService.validateAndCalculateDiscounts(
          userId,
          couponCodes,
          cart.items,
        )
      : [];

    const platformItem =
      couponItems.find((c) => c.coupon_shop_id == null) ?? null;
    const shopCouponMap = new Map<number, ICouponCalculationItem>();
    for (const c of couponItems) {
      if (c.coupon_shop_id != null) shopCouponMap.set(c.coupon_shop_id, c);
    }

    // Platform coupon → split across shops by each shop's applicable subtotal
    // (largest-remainder on VND minor units so parts sum exactly). Shop coupons
    // land entirely on their own shop's sub-order.
    let platformShareByShop = new Map<number, number>();
    if (platformItem && platformItem.discount_amount > 0) {
      platformShareByShop = this.distributeDiscountByApplicable(
        platformItem.discount_amount,
        new Map(
          Object.entries(platformItem.applicable_by_shop).map(([k, v]) => [
            Number(k),
            Number(v),
          ]),
        ),
      );
    }

    const totalDiscount = couponItems.reduce(
      (sum, c) => sum + c.discount_amount,
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
        const shopItemsTotal = items.reduce(
          (sum, item) => sum + item.price * item.quantity,
          0,
        );

        // Shop coupon lands first; platform share fills the remaining headroom.
        const shopCoupon = shopCouponMap.get(shopId) ?? null;
        const shopCouponDiscount = Math.min(
          shopCoupon?.discount_amount ?? 0,
          shopItemsTotal,
        );
        const platformShareAdj = Math.min(
          platformShareByShop.get(shopId) ?? 0,
          Math.max(0, shopItemsTotal - shopCouponDiscount),
        );
        const shopDiscount = shopCouponDiscount + platformShareAdj;
        const shopTotal = shopItemsTotal - shopDiscount + shippingFee;

        // Snapshot a single code (legacy column): prefer the shop coupon, else
        // the platform coupon. Full breakdown lives in coupon_usages.
        const snapshotCode =
          shopCoupon && shopCouponDiscount > 0
            ? shopCoupon.coupon_code
            : platformItem && platformShareAdj > 0
              ? platformItem.coupon_code
              : null;

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

        // Record one usage row per coupon that actually discounted this
        // sub-order. Global count is incremented once per coupon per checkout.
        if (shopCoupon && shopCouponDiscount > 0) {
          await this.couponService.recordUsage(
            shopCoupon.coupon_id,
            userId,
            order.id,
            shopCouponDiscount,
            queryRunner.manager,
            !globalIncremented.has(shopCoupon.coupon_id),
          );
          globalIncremented.add(shopCoupon.coupon_id);
        }
        if (platformItem && platformShareAdj > 0) {
          await this.couponService.recordUsage(
            platformItem.coupon_id,
            userId,
            order.id,
            platformShareAdj,
            queryRunner.manager,
            !globalIncremented.has(platformItem.coupon_id),
          );
          globalIncremented.add(platformItem.coupon_id);
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

    return toAdminOrderResponse(order);
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

    return toSellerOrderResponse(order);
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
  private resolveCouponCodes(dto: CreateOrderDto): string[] {
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

  /**
   * Distributes a platform discount across shops proportionally to each shop's
   * applicable subtotal. Works in VND minor units (×100) with largest-remainder
   * rounding so the returned per-shop amounts sum exactly to `totalDiscount`.
   */
  private distributeDiscountByApplicable(
    totalDiscount: number,
    applicableByShop: Map<number, number>,
  ): Map<number, number> {
    const result = new Map<number, number>();

    const totalApplicable = [...applicableByShop.values()].reduce(
      (sum, v) => sum + v,
      0,
    );
    if (totalApplicable <= 0 || totalDiscount <= 0) {
      for (const shopId of applicableByShop.keys()) result.set(shopId, 0);
      return result;
    }

    const totalMinor = Math.round(totalDiscount * 100);
    const entries = [...applicableByShop.entries()].filter(([, w]) => w > 0);

    const parts = entries.map(([shopId, weight]) => {
      const exact = (totalMinor * weight) / totalApplicable;
      const floorMinor = Math.floor(exact);
      return { shopId, floorMinor, frac: exact - floorMinor };
    });

    let remainder = totalMinor - parts.reduce((s, p) => s + p.floorMinor, 0);
    parts.sort((a, b) => b.frac - a.frac);
    for (let i = 0; i < parts.length && remainder > 0; i++) {
      parts[i].floorMinor += 1;
      remainder--;
    }

    for (const p of parts) result.set(p.shopId, p.floorMinor / 100);
    // shops with zero applicable subtotal receive nothing
    for (const [shopId, weight] of applicableByShop.entries()) {
      if (weight <= 0 && !result.has(shopId)) result.set(shopId, 0);
    }

    return result;
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
