import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { NotificationService } from './notification.service';
import { NotificationQueryDto } from './dto/notification-query.dto';
import {
  NotificationResponseDto,
  UnreadCountResponseDto,
} from './dto/notification-response.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { ICurrentUser } from '../../common/interfaces/current-user.interface';
import { NotificationContext } from './types/notification.types';

@ApiTags('Notification')
@ApiBearerAuth()
@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  @ApiOperation({ summary: 'List my notifications (paginated)' })
  @ApiResponse({ status: 200, type: [NotificationResponseDto] })
  async findAll(
    @CurrentUser() user: ICurrentUser,
    @Query() query: NotificationQueryDto,
  ) {
    return this.notificationService.getMyNotifications(user.id, query);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread notification count' })
  @ApiResponse({ status: 200, type: UnreadCountResponseDto })
  @ApiQuery({ name: 'context', enum: NotificationContext, required: false })
  async getUnreadCount(
    @CurrentUser() user: ICurrentUser,
    @Query('context') context?: NotificationContext,
  ) {
    return this.notificationService.getUnreadCount(user.id, context);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark notification as read' })
  @ApiResponse({ status: 200, type: NotificationResponseDto })
  @ApiResponse({
    status: 404,
    description: 'NOTIFICATION_001: Notification not found',
  })
  async markAsRead(
    @CurrentUser() user: ICurrentUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.notificationService.markAsRead(user.id, id);
  }

  @Patch('read-all')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Mark all notifications as read' })
  @ApiResponse({ status: 204 })
  @ApiQuery({ name: 'context', enum: NotificationContext, required: false })
  async markAllAsRead(
    @CurrentUser() user: ICurrentUser,
    @Query('context') context?: NotificationContext,
  ) {
    return this.notificationService.markAllAsRead(user.id, context);
  }
}
