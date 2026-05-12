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
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { UpdatePaymentStatusDto } from './dto/update-payment-status.dto';
import { OrderQueryDto } from './dto/order-query.dto';
import {
  OrderResponseDto,
  AdminOrderResponseDto,
  OrderListItemResponseDto,
} from './dto/order-response.dto';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import {
  VALID_STATUS_TRANSITIONS,
  DEFAULT_SHIPPING_FEE,
  IShippingAddressSnapshot,
} from './types/order.types';
import {
  toOrderResponse,
  toOrderListItemResponse,
  toAdminOrderResponse,
} from './utils/order.util';
import { OrderStatus } from '../../common/constants';
import { InsufficientStockException } from '../../common/exceptions/insufficient-stock.exception';
import { IPaginatedResult } from '../../common/interfaces/paginated-result.interface';

@Injectable()
export class OrderService {
  private readonly logger = new Logger(OrderService.name);

  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly orderItemRepository: OrderItemRepository,
    private readonly cartService: CartService,
    private readonly productService: ProductService,
    private readonly userProfileService: UserProfileService,
    private readonly eventEmitter: EventEmitter2,
    private readonly dataSource: DataSource,
  ) {}

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
      const price = Number(variant.sale_price ?? variant.price);
      itemsTotal += price * item.quantity;

      return {
        product_variant_id: variant.id,
        product_name: variant.product?.name ?? '',
        sku: variant.sku,
        price,
        quantity: item.quantity,
        thumbnail_url: variant.product?.thumbnail_url ?? null,
      };
    });

    const totalAmount = itemsTotal + shippingFee;

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
        `Order #${order.id} created for user ${userId}, payment: ${dto.payment_method}`,
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
  ): Promise<IPaginatedResult<OrderListItemResponseDto>> {
    const result = await this.orderRepository.findByUserIdPaginated(
      userId,
      query.page || 1,
      query.limit || 20,
      query.sort,
      query.order,
    );

    return {
      data: result.data.map(toOrderListItemResponse),
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

    const allowedTransitions = VALID_STATUS_TRANSITIONS[order.status] || [];
    if (!allowedTransitions.includes(dto.status)) {
      throw new BadRequestException({
        code: 'ORDER_003',
        message: `Invalid status transition from ${order.status} to ${dto.status}`,
      });
    }

    await this.orderRepository.updateStatus(orderId, dto.status);
    order.status = dto.status;

    if (dto.status === OrderStatus.Cancelled) {
      this.eventEmitter.emit('order.cancelled', {
        orderId: order.id,
        items: order.order_items.map((item) => ({
          productVariantId: item.product_variant_id,
          quantity: item.quantity,
        })),
      });
    }

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

    await this.orderRepository.updatePaymentStatus(orderId, dto.payment_status);
    order.payment_status = dto.payment_status;

    this.logger.log(
      `Order #${orderId} payment status updated to ${dto.payment_status}`,
    );

    return toAdminOrderResponse(order);
  }

  // ─── Cross-feature: consumed by review ───

  async findOrderByIdForReview(orderId: number): Promise<Order | null> {
    return this.orderRepository.findByIdWithItems(orderId);
  }
}
