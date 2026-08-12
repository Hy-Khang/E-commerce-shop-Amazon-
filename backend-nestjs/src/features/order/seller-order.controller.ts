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
  SellerOrderResponseDto,
  OrderListItemResponseDto,
} from './dto/order-response.dto';
import { OrderTrackingResponseDto } from './dto/order-tracking-response.dto';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PERMISSIONS } from '../../common/constants/permissions.constant';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { ICurrentUser } from '../../common/interfaces/current-user.interface';

@ApiTags('Seller: Orders')
@ApiBearerAuth()
@Controller('seller/orders')
export class SellerOrderController {
  constructor(private readonly orderService: OrderService) {}

  @Get()
  @Permissions(PERMISSIONS.ORDERS_READ)
  @ApiOperation({ summary: 'List orders containing seller\'s products (paginated)' })
  @ApiResponse({ status: 200, description: 'Returns paginated order list', type: [OrderListItemResponseDto] })
  async findAll(@CurrentUser() user: ICurrentUser, @Query() query: OrderQueryDto) {
    return this.orderService.findSellerOrders(user.id, query);
  }

  @Get(':id/tracking')
  @Permissions(PERMISSIONS.ORDERS_READ)
  @ApiOperation({ summary: 'Get order tracking (timeline + shipper location)' })
  @ApiResponse({ status: 200, description: 'Returns tracking data', type: OrderTrackingResponseDto })
  @ApiResponse({ status: 404, description: 'ORDER_001: Order not found' })
  async getTracking(@Param('id', ParseIntPipe) id: number) {
    return this.orderService.getOrderTrackingForRole(id);
  }

  @Get(':id')
  @Permissions(PERMISSIONS.ORDERS_READ)
  @ApiOperation({ summary: 'Get order detail (only seller\'s items shown)' })
  @ApiResponse({ status: 200, description: 'Returns order detail with seller items', type: SellerOrderResponseDto })
  @ApiResponse({ status: 404, description: 'ORDER_001: Order not found or no items belong to seller' })
  async findOne(@CurrentUser() user: ICurrentUser, @Param('id', ParseIntPipe) id: number) {
    return this.orderService.findSellerOrderById(user.id, id);
  }

  @Patch(':id/status')
  @Permissions(PERMISSIONS.ORDERS_UPDATE)
  @ApiOperation({ summary: 'Update order status (seller: pending→confirmed→shipping→delivered)' })
  @ApiResponse({ status: 200, description: 'Order status updated', type: SellerOrderResponseDto })
  @ApiResponse({ status: 400, description: 'ORDER_003: Invalid status transition' })
  @ApiResponse({ status: 404, description: 'ORDER_001: Order not found' })
  async updateStatus(
    @CurrentUser() user: ICurrentUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.orderService.updateSellerOrderStatus(user.id, id, dto);
  }

  @Patch(':id/payment-status')
  @Permissions(PERMISSIONS.ORDERS_UPDATE)
  @ApiOperation({ summary: 'Update payment status (unpaid → paid)' })
  @ApiResponse({ status: 200, description: 'Payment status updated', type: SellerOrderResponseDto })
  @ApiResponse({ status: 400, description: 'ORDER_003: Invalid payment status update' })
  @ApiResponse({ status: 404, description: 'ORDER_001: Order not found' })
  async updatePaymentStatus(
    @CurrentUser() user: ICurrentUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePaymentStatusDto,
  ) {
    return this.orderService.updateSellerPaymentStatus(user.id, id, dto);
  }
}
