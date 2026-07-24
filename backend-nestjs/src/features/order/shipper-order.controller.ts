import {
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
import { ShipperOrderQueryDto } from './dto/shipper-order-query.dto';
import {
  AdminOrderResponseDto,
  OrderListItemResponseDto,
} from './dto/order-response.dto';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PERMISSIONS } from '../../common/constants/permissions.constant';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { ICurrentUser } from '../../common/interfaces/current-user.interface';

@ApiTags('Shipper: Orders')
@ApiBearerAuth()
@Controller('shipper/orders')
export class ShipperOrderController {
  constructor(private readonly orderService: OrderService) {}

  @Get()
  @Permissions(PERMISSIONS.ORDERS_READ)
  @ApiOperation({ summary: 'List orders for shipper (available or my deliveries)' })
  @ApiResponse({ status: 200, description: 'Returns paginated order list', type: [OrderListItemResponseDto] })
  async findAll(@CurrentUser() user: ICurrentUser, @Query() query: ShipperOrderQueryDto) {
    return this.orderService.findShipperOrders(user.id, query);
  }

  @Get(':id')
  @Permissions(PERMISSIONS.ORDERS_READ)
  @ApiOperation({ summary: 'Get order detail (assigned to shipper or available)' })
  @ApiResponse({ status: 200, description: 'Returns order detail', type: AdminOrderResponseDto })
  @ApiResponse({ status: 404, description: 'ORDER_001: Order not found' })
  async findOne(@CurrentUser() user: ICurrentUser, @Param('id', ParseIntPipe) id: number) {
    return this.orderService.findShipperOrderById(user.id, id);
  }

  @Patch(':id/accept')
  @Permissions(PERMISSIONS.ORDERS_UPDATE)
  @ApiOperation({ summary: 'Accept order for delivery (confirmed → shipping)' })
  @ApiResponse({ status: 200, description: 'Order accepted', type: AdminOrderResponseDto })
  @ApiResponse({ status: 400, description: 'ORDER_003: Already assigned or not confirmed' })
  async acceptOrder(@CurrentUser() user: ICurrentUser, @Param('id', ParseIntPipe) id: number) {
    return this.orderService.acceptOrder(user.id, id);
  }

  @Patch(':id/deliver')
  @Permissions(PERMISSIONS.ORDERS_UPDATE)
  @ApiOperation({ summary: 'Mark order as delivered (shipping → delivered)' })
  @ApiResponse({ status: 200, description: 'Order marked as delivered', type: AdminOrderResponseDto })
  @ApiResponse({ status: 400, description: 'ORDER_003: Invalid transition or unpaid' })
  @ApiResponse({ status: 403, description: 'ORDER_004: Not assigned to this shipper' })
  async markDelivered(@CurrentUser() user: ICurrentUser, @Param('id', ParseIntPipe) id: number) {
    return this.orderService.markDelivered(user.id, id);
  }
}
