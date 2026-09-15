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
import { ToolDispatcher } from './tools/tool-dispatcher';
import { ProductModule } from '../product/product.module';
import { CartModule } from '../cart/cart.module';
import { OrderModule } from '../order/order.module';
import { UserProfileModule } from '../user-profile/user-profile.module';
import { CouponModule } from '../coupon/coupon.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([AiConversation, AiMessage, AiSetting]),
    // Agent tools reuse these features' services (no repos/entities touched).
    // One-way import (only AppModule imports AiChatModule) → no circular dep.
    ProductModule,
    CartModule,
    OrderModule,
    UserProfileModule,
    CouponModule,
  ],
  controllers: [AiChatController, AdminAiChatController],
  providers: [
    AiChatService,
    ToolDispatcher,
    AiConversationRepository,
    AiMessageRepository,
    AiSettingRepository,
  ],
  exports: [AiChatService],
})
export class AiChatModule {}
