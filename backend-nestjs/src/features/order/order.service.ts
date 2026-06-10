import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DataSource } from 'typeorm';
import { OrderRepository } from './repositories/order.repository';
import { OrderItemRepository } from './repositories/order-item.repository';
import { CartService } from '../cart/cart.service';
import { ProductService } from '../product/product.service';
import { UserProfileService } from '../user-profile/user-profile.service';
import { CouponService } from '../coupon/coupon.service';
import { IDiscountCalculation } from '../coupon/types/coupon.types';
import { pickVariantThumbnail } from '../cart/utils/cart.util';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { UpdatePaymentStatusDto } from './dto/update-payment-status.dto';
import { OrderQueryDto } from './dto/order-query.dto';
import {
  OrderResponseDto,
  AdminOrderResponseDto,
  SellerOrderResponseDto,
  OrderListItemResponseDto,
  OrderListItemWithItemsResponseDto,
} from './dto/order-response.dto';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import {
  ADMIN_STATUS_TRANSITIONS,
  SELLER_STATUS_TRANSITIONS,
  CUSTOMER_STATUS_TRANSITIONS,
  DEFAULT_SHIPPING_FEE,
  IShippingAddressSnapshot,
} from './types/order.types';
import {
  toOrderResponse,
  toOrderListItemResponse,
  toOrderListItemWithItemsResponse,
  toAdminOrderResponse,
  toSellerOrderResponse,
} from './utils/order.util';
import { OrderStatus, PaymentMethod } from '../../common/constants';
import { InsufficientStockException } from '../../common/exceptions/insufficient-stock.exception';
import { IPaginatedResult } from '../../common/interfaces/paginated-result.interface';
import { ShopService } from '../shop/shop.service';

@Injectable()
export class OrderService {
  private readonly logger = new Logger(OrderService.name);

  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly orderItemRepository: OrderItemRepository,
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
  ): Promise<OrderResponseDto> {
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
    };

    const shippingFee = DEFAULT_SHIPPING_FEE;
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

    // ── Coupon validation (if provided) ──

    let couponData: IDiscountCalculation | null = null;
    if (dto.coupon_code) {
      couponData = await this.couponService.validateAndCalculateDiscount(
        userId,
        dto.coupon_code,
        cart.items,
      );
    }

    const discountAmount = couponData?.discount_amount ?? 0;
    const totalAmount = itemsTotal - discountAmount + shippingFee;

    // ── Transaction: create order + items, clear cart ──

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const order = await queryRunner.manager.save(
        queryRunner.manager.create(Order, {
          user_id: userId,
          status: OrderStatus.Pending,
          payment_method: dto.payment_method,
          payment_status: 'unpaid',
          shipping_fee: shippingFee,
          coupon_code: couponData?.coupon_code ?? null,
          discount_amount: discountAmount,
          total_amount: totalAmount,
          shipping_address: JSON.stringify(shippingSnapshot),
        }),
      );

      const orderItems = await queryRunner.manager.save(
        queryRunner.manager.create(
          OrderItem,
          orderItemsData.map((item) => ({ ...item, order_id: order.id })),
        ),
      );
      order.order_items = orderItems;

      if (couponData) {
        await this.couponService.recordUsage(
          couponData.coupon_id,
          userId,
          order.id,
          discountAmount,
          queryRunner.manager,
        );
      }

      await this.cartService.clearCart(userId, queryRunner.manager);

      await queryRunner.commitTransaction();

      // ── Side effects (after commit) ──

      this.eventEmitter.emit('order.created', {
        orderId: order.id,
        items: cart.items.map((item) => ({
          productVariantId: item.product_variant_id,
          quantity: item.quantity,
        })),
      });

      this.logger.log(
        `Order #${order.id} created for user ${userId}, payment: ${dto.payment_method}${couponData ? `, coupon: ${couponData.coupon_code}, discount: ${discountAmount}` : ''}`,
      );

      return toOrderResponse(order);
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

    return toOrderResponse(order);
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

    const sellerUserIds = await this.resolveSellerUserIds(order.order_items);

    this.eventEmitter.emit('order.status_updated', {
      orderId: order.id,
      userId: order.user_id,
      notifyUserIds: sellerUserIds,
      oldStatus,
      newStatus: OrderStatus.Completed,
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

    const sellerUserIds = await this.resolveSellerUserIds(order.order_items);

    this.eventEmitter.emit('order.status_updated', {
      orderId: order.id,
      userId: order.user_id,
      notifyUserIds: sellerUserIds,
      oldStatus,
      newStatus: OrderStatus.ReturnRequested,
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

    await this.orderRepository.updateStatus(orderId, OrderStatus.Cancelled);
    order.status = OrderStatus.Cancelled;

    await this.couponService.reverseCouponUsage(orderId);

    this.eventEmitter.emit('order.cancelled', {
      orderId: order.id,
      items: order.order_items.map((item) => ({
        productVariantId: item.product_variant_id,
        quantity: item.quantity,
      })),
    });

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
      await this.couponService.reverseCouponUsage(orderId);

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

    return toSellerOrderResponse(order, shop.id);
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
    });

    this.logger.log(
      `Order #${orderId} status updated to ${dto.status} by seller ${userId}`,
    );

    return toSellerOrderResponse(order, shop.id);
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

    return toSellerOrderResponse(order, shop.id);
  }

  // ─── Cross-feature: consumed by review ───

  async findOrderByIdForReview(orderId: number): Promise<Order | null> {
    return this.orderRepository.findByIdWithItems(orderId);
  }

  // ─── Private helpers ───

  private async resolveSellerUserIds(orderItems: OrderItem[]): Promise<number[]> {
    const shopIds = [
      ...new Set(
        orderItems.map((i) => i.shop_id).filter((id): id is number => id != null),
      ),
    ];
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
