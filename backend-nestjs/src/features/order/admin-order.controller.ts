import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { OrderService } from './order.service';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { UpdatePaymentStatusDto } from './dto/update-payment-status.dto';
import { OrderQueryDto } from './dto/order-query.dto';
import {
  AdminOrderResponseDto,
  OrderListItemResponseDto,
} from './dto/order-response.dto';
import { OrderTrackingResponseDto } from './dto/order-tracking-response.dto';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PERMISSIONS } from '../../common/constants/permissions.constant';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { ICurrentUser } from '../../common/interfaces/current-user.interface';

@ApiTags('Admin: Orders')
@ApiBearerAuth()
@Controller('admin/orders')
export class AdminOrderController {
  constructor(private readonly orderService: OrderService) {}

  @Get()
  @Permissions(PERMISSIONS.ORDERS_READ)
  @ApiOperation({ summary: 'List all orders (paginated)' })
  @ApiResponse({
    status: 200,
    description: 'Returns paginated order list',
    type: [OrderListItemResponseDto],
  })
  async findAll(@Query() query: OrderQueryDto) {
    return this.orderService.findAllOrders(query);
  }

  @Get(':id/tracking')
  @Permissions(PERMISSIONS.ORDERS_READ)
  @ApiOperation({ summary: 'Get order tracking (timeline + shipper location)' })
  @ApiResponse({
    status: 200,
    description: 'Returns tracking data',
    type: OrderTrackingResponseDto,
  })
  @ApiResponse({ status: 404, description: 'ORDER_001: Order not found' })
  async getTracking(@Param('id', ParseIntPipe) id: number) {
    return this.orderService.getOrderTrackingForRole(id);
  }

  @Get(':id')
  @Permissions(PERMISSIONS.ORDERS_READ)
  @ApiOperation({ summary: 'Get order detail + order_items + user info' })
  @ApiResponse({
    status: 200,
    description: 'Returns order detail with user info',
    type: AdminOrderResponseDto,
  })
  @ApiResponse({ status: 404, description: 'ORDER_001: Order not found' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.orderService.findOrderById(id);
  }

  @Patch(':id/status')
  @Permissions(PERMISSIONS.ORDERS_UPDATE)
  @ApiOperation({ summary: 'Update order status (valid transitions only)' })
  @ApiResponse({
    status: 200,
    description: 'Order status updated',
    type: AdminOrderResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'ORDER_003: Invalid status transition',
  })
  @ApiResponse({ status: 404, description: 'ORDER_001: Order not found' })
  async updateStatus(
    @CurrentUser() user: ICurrentUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.orderService.updateOrderStatus(id, dto, user.id);
  }

  @Patch(':id/payment-status')
  @Permissions(PERMISSIONS.ORDERS_UPDATE)
  @ApiOperation({ summary: 'Update payment status' })
  @ApiResponse({
    status: 200,
    description: 'Payment status updated',
    type: AdminOrderResponseDto,
  })
  @ApiResponse({ status: 404, description: 'ORDER_001: Order not found' })
  async updatePaymentStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePaymentStatusDto,
  ) {
    return this.orderService.updatePaymentStatus(id, dto);
  }
}
