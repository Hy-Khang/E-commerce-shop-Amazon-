import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiConversation } from './entities/ai-conversation.entity';
import { AiMessage } from './entities/ai-message.entity';
import { AiSetting } from './entities/ai-setting.entity';
import { AiConversationRepository } from './repositories/ai-conversation.repository';
import { AiMessageRepository } from './repositories/ai-message.repository';
import { AiSettingRepository } from './repositories/ai-setting.repository';
import { AiChatService } from './ai-chat.service';
import { AiChatController } from './ai-chat.controller';
import { AdminAiChatController } from './admin-ai-chat.controller';
import { ProductModule } from '../product/product.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([AiConversation, AiMessage, AiSetting]),
    ProductModule,
  ],
  controllers: [AiChatController, AdminAiChatController],
  providers: [
    AiChatService,
    AiConversationRepository,
    AiMessageRepository,
    AiSettingRepository,
  ],
  exports: [AiChatService],
})
export class AiChatModule {}
