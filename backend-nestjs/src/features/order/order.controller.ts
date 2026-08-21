import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { PreviewOrderDto } from './dto/preview-order.dto';
import { OrderQueryDto } from './dto/order-query.dto';
import {
  OrderResponseDto,
  CheckoutResponseDto,
  CheckoutPreviewResponseDto,
  OrderListItemWithItemsResponseDto,
} from './dto/order-response.dto';
import { OrderTrackingResponseDto } from './dto/order-tracking-response.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { ICurrentUser } from '../../common/interfaces/current-user.interface';

@ApiTags('Order')
@ApiBearerAuth()
@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  @ApiOperation({ summary: 'Checkout — create orders from cart (1 per shop)' })
  @ApiResponse({ status: 201, description: 'Orders created', type: CheckoutResponseDto })
  @ApiResponse({ status: 400, description: 'CART_002: Cart empty / ORDER_002: Insufficient stock' })
  @ApiResponse({ status: 404, description: 'COMMON_001: Address not found' })
  async checkout(
    @CurrentUser() user: ICurrentUser,
    @Body() dto: CreateOrderDto,
  ) {
    return this.orderService.checkout(user.id, dto);
  }

  @Post('preview')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Preview checkout totals + coupon breakdown (advisory, no writes)',
  })
  @ApiResponse({ status: 200, description: 'Checkout estimate', type: CheckoutPreviewResponseDto })
  @ApiResponse({ status: 400, description: 'COUPON_0xx: Invalid coupon' })
  async preview(
    @CurrentUser() user: ICurrentUser,
    @Body() dto: PreviewOrderDto,
  ) {
    return this.orderService.previewCheckout(user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List my orders (paginated)' })
  @ApiResponse({ status: 200, description: 'Returns paginated order list', type: [OrderListItemWithItemsResponseDto] })
  async findMyOrders(
    @CurrentUser() user: ICurrentUser,
    @Query() query: OrderQueryDto,
  ) {
    return this.orderService.findMyOrders(user.id, query);
  }

  @Get('group/:groupId')
  @ApiOperation({ summary: 'Get all orders in a group (own only)' })
  @ApiResponse({ status: 200, description: 'Returns orders in group', type: [OrderResponseDto] })
  @ApiResponse({ status: 404, description: 'ORDER_001: Order group not found' })
  async findOrderGroup(
    @CurrentUser() user: ICurrentUser,
    @Param('groupId') groupId: string,
  ) {
    return this.orderService.findMyOrdersByGroupId(user.id, groupId);
  }

  @Get(':id/tracking')
  @ApiOperation({ summary: 'Get order tracking timeline + shipper location' })
  @ApiResponse({ status: 200, description: 'Returns tracking data', type: OrderTrackingResponseDto })
  @ApiResponse({ status: 403, description: 'ORDER_004: Order does not belong to user' })
  @ApiResponse({ status: 404, description: 'ORDER_001: Order not found' })
  async getTracking(
    @CurrentUser() user: ICurrentUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.orderService.getOrderTracking(user.id, id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order detail + order_items (own only)' })
  @ApiResponse({ status: 200, description: 'Returns order detail', type: OrderResponseDto })
  @ApiResponse({ status: 404, description: 'ORDER_001: Order not found' })
  @ApiResponse({ status: 403, description: 'ORDER_004: Order does not belong to user' })
  async findOne(
    @CurrentUser() user: ICurrentUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.orderService.findMyOrderById(user.id, id);
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Cancel order (if status = pending)' })
  @ApiResponse({ status: 200, description: 'Order cancelled', type: OrderResponseDto })
  @ApiResponse({ status: 400, description: 'ORDER_003: Invalid status transition' })
  @ApiResponse({ status: 403, description: 'ORDER_004: Order does not belong to user' })
  @ApiResponse({ status: 404, description: 'ORDER_001: Order not found' })
  async cancel(
    @CurrentUser() user: ICurrentUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.orderService.cancelOrder(user.id, id);
  }

  @Patch(':id/confirm-receipt')
  @ApiOperation({ summary: 'Confirm receipt — mark delivered order as completed' })
  @ApiResponse({ status: 200, description: 'Order completed', type: OrderResponseDto })
  @ApiResponse({ status: 400, description: 'ORDER_005: Order not in delivered status' })
  @ApiResponse({ status: 403, description: 'ORDER_004: Order does not belong to user' })
  @ApiResponse({ status: 404, description: 'ORDER_001: Order not found' })
  async confirmReceipt(
    @CurrentUser() user: ICurrentUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.orderService.confirmReceipt(user.id, id);
  }

  @Patch(':id/return-request')
  @ApiOperation({ summary: 'Request return/refund for delivered order' })
  @ApiResponse({ status: 200, description: 'Return requested', type: OrderResponseDto })
  @ApiResponse({ status: 400, description: 'ORDER_005: Order not in delivered status' })
  @ApiResponse({ status: 403, description: 'ORDER_004: Order does not belong to user' })
  @ApiResponse({ status: 404, description: 'ORDER_001: Order not found' })
  async requestReturn(
    @CurrentUser() user: ICurrentUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.orderService.requestReturn(user.id, id);
  }
}
