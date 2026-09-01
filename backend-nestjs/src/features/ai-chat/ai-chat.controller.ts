import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import {
  ApiHeader,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AiChatService } from './ai-chat.service';
import { ChatDto } from './dto/chat.dto';
import {
  AiConfigResponseDto,
  AiConversationDetailResponseDto,
  ChatResponseDto,
} from './dto/chat-response.dto';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { ICurrentUser } from '../../common/interfaces/current-user.interface';
import { AiChatOwner } from './types/ai-chat.types';

@ApiTags('AI Chatbox')
@Controller('ai')
export class AiChatController {
  constructor(private readonly aiChatService: AiChatService) {}

  @Public()
  @Get('config')
  @ApiOperation({ summary: 'Whether the storefront chatbox is enabled' })
  @ApiResponse({ status: 200, type: AiConfigResponseDto })
  async getConfig(): Promise<AiConfigResponseDto> {
    return this.aiChatService.getConfig();
  }

  @Public()
  @Post('chat')
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  @ApiOperation({
    summary: 'Send a message to the AI chatbox (guest or customer)',
  })
  @ApiHeader({ name: 'x-session-id', required: false, description: 'Guest session ID' })
  @ApiResponse({ status: 201, type: ChatResponseDto })
  @ApiResponse({ status: 400, description: 'CHATBOT_002 / CHATBOT_005' })
  @ApiResponse({ status: 403, description: 'CHATBOT_003: Not your conversation' })
  @ApiResponse({ status: 404, description: 'CHATBOT_001: Conversation not found' })
  @ApiResponse({ status: 503, description: 'CHATBOT_004: AI not configured' })
  async chat(
    @CurrentUser() user: ICurrentUser | undefined,
    @Headers('x-session-id') sessionId: string | undefined,
    @Body() dto: ChatDto,
  ): Promise<ChatResponseDto> {
    return this.aiChatService.chat(dto, this.resolveOwner(user, sessionId));
  }

  @Public()
  @Get('conversations/:id')
  @ApiOperation({ summary: 'Get a conversation to resume (own only)' })
  @ApiHeader({ name: 'x-session-id', required: false, description: 'Guest session ID' })
  @ApiResponse({ status: 200, type: AiConversationDetailResponseDto })
  @ApiResponse({ status: 403, description: 'CHATBOT_003: Not your conversation' })
  @ApiResponse({ status: 404, description: 'CHATBOT_001: Conversation not found' })
  async getConversation(
    @CurrentUser() user: ICurrentUser | undefined,
    @Headers('x-session-id') sessionId: string | undefined,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<AiConversationDetailResponseDto> {
    return this.aiChatService.getConversation(
      id,
      this.resolveOwner(user, sessionId),
    );
  }

  /** Customer (JWT) → user owner; else guest via x-session-id (mirrors cart). */
  private resolveOwner(
    user: ICurrentUser | undefined,
    sessionId: string | undefined,
  ): AiChatOwner {
    if (user?.id) return { userId: user.id, sessionId: null };
    if (sessionId) return { userId: null, sessionId };
    throw new BadRequestException({
      code: 'CHATBOT_002',
      message: 'Missing session — provide x-session-id header or sign in',
    });
  }
}
