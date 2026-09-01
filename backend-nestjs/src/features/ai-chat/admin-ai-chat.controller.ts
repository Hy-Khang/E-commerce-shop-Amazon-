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
import { AiChatService } from './ai-chat.service';
import {
  AiConversationDetailResponseDto,
} from './dto/chat-response.dto';
import {
  AiSettingsResponseDto,
  UpdateAiSettingsDto,
} from './dto/ai-settings.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PERMISSIONS } from '../../common/constants/permissions.constant';

@ApiTags('Admin — AI Chatbox')
@ApiBearerAuth()
@Controller('admin/ai')
export class AdminAiChatController {
  constructor(private readonly aiChatService: AiChatService) {}

  @Get('conversations')
  @Permissions(PERMISSIONS.AI_CHATBOX_READ)
  @ApiOperation({ summary: 'List AI conversations (paginated, newest activity)' })
  async listConversations(@Query() query: PaginationDto) {
    return this.aiChatService.adminListConversations(query.page, query.limit);
  }

  @Get('conversations/:id')
  @Permissions(PERMISSIONS.AI_CHATBOX_READ)
  @ApiOperation({ summary: 'Get an AI conversation with its messages' })
  @ApiResponse({ status: 200, type: AiConversationDetailResponseDto })
  @ApiResponse({ status: 404, description: 'CHATBOT_001: Conversation not found' })
  async getConversation(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<AiConversationDetailResponseDto> {
    return this.aiChatService.adminGetConversation(id);
  }

  @Get('settings')
  @Permissions(PERMISSIONS.AI_CHATBOX_READ)
  @ApiOperation({ summary: 'Read AI chatbox settings' })
  @ApiResponse({ status: 200, type: AiSettingsResponseDto })
  async getSettings(): Promise<AiSettingsResponseDto> {
    return this.aiChatService.getSettings();
  }

  @Patch('settings')
  @Permissions(PERMISSIONS.AI_CHATBOX_UPDATE)
  @ApiOperation({ summary: 'Update AI chatbox settings (enable/disable, prompt)' })
  @ApiResponse({ status: 200, type: AiSettingsResponseDto })
  async updateSettings(
    @Body() dto: UpdateAiSettingsDto,
  ): Promise<AiSettingsResponseDto> {
    return this.aiChatService.updateSettings(dto);
  }
}
