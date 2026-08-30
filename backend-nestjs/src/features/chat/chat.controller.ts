import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
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
import { ChatService } from './chat.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { SendMessageDto } from './dto/send-message.dto';
import {
  ChatUnreadCountResponseDto,
  ConversationResponseDto,
  MessageResponseDto,
} from './dto/chat-response.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { ICurrentUser } from '../../common/interfaces/current-user.interface';

@ApiTags('Chat')
@ApiBearerAuth()
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('conversations')
  @ApiOperation({ summary: 'Start or get a conversation with a shop' })
  @ApiResponse({ status: 201, type: ConversationResponseDto })
  @ApiResponse({
    status: 400,
    description: 'CHAT_003: Cannot chat with your own shop',
  })
  @ApiResponse({ status: 404, description: 'SHOP_001: Shop not found' })
  async startConversation(
    @CurrentUser() user: ICurrentUser,
    @Body() dto: CreateConversationDto,
  ) {
    return this.chatService.startConversation(user.id, dto.shop_id);
  }

  @Get('conversations')
  @ApiOperation({ summary: 'List my conversations (customer + seller sides)' })
  @ApiResponse({ status: 200, type: [ConversationResponseDto] })
  async listConversations(@CurrentUser() user: ICurrentUser) {
    return this.chatService.listConversations(user.id);
  }

  @Get('conversations/:id/messages')
  @ApiOperation({ summary: 'Paginated message history (membership enforced)' })
  @ApiResponse({ status: 200, type: [MessageResponseDto] })
  @ApiResponse({ status: 403, description: 'CHAT_002: Not a participant' })
  @ApiResponse({ status: 404, description: 'CHAT_001: Conversation not found' })
  async getMessages(
    @CurrentUser() user: ICurrentUser,
    @Param('id', ParseIntPipe) id: number,
    @Query() query: PaginationDto,
  ) {
    return this.chatService.getMessages(user.id, id, query.page, query.limit);
  }

  @Post('conversations/:id/messages')
  @ApiOperation({ summary: 'Send a message in a conversation' })
  @ApiResponse({ status: 201, type: MessageResponseDto })
  @ApiResponse({ status: 403, description: 'CHAT_002: Not a participant' })
  @ApiResponse({ status: 404, description: 'CHAT_001: Conversation not found' })
  async sendMessage(
    @CurrentUser() user: ICurrentUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SendMessageDto,
  ) {
    return this.chatService.sendMessage(user.id, id, dto.content);
  }

  @Patch('conversations/:id/read')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Mark a conversation read (reset unread, emit receipts)',
  })
  @ApiResponse({ status: 204 })
  async markRead(
    @CurrentUser() user: ICurrentUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    await this.chatService.markRead(user.id, id);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Total unread messages for the header badge' })
  @ApiResponse({ status: 200, type: ChatUnreadCountResponseDto })
  async getUnreadCount(@CurrentUser() user: ICurrentUser) {
    return this.chatService.getUnreadCount(user.id);
  }
}
