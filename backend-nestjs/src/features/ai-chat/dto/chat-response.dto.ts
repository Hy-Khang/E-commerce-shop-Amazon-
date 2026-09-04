import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProductResponseDto } from '../../product/dto/product-response.dto';

/** A user-facing agent action card returned alongside the assistant reply. */
export class AgentActionDto {
  @ApiProperty({
    enum: [
      'cart_updated',
      'checkout_proposal',
      'order_cancelled',
      'needs_login',
    ],
    description: 'Action type — drives which card the widget renders',
  })
  type: string;

  @ApiProperty({ description: 'Action payload (shape depends on type)' })
  data: unknown;
}

export class ChatResponseDto {
  @ApiProperty()
  conversation_id: number;

  @ApiProperty({ description: 'Assistant reply text' })
  reply: string;

  @ApiProperty({
    type: [ProductResponseDto],
    description: 'Suggested products (same shape as GET /products)',
  })
  products: ProductResponseDto[];

  @ApiPropertyOptional({
    type: [AgentActionDto],
    description: 'Agent action cards (cart update, checkout proposal, ...)',
  })
  actions?: AgentActionDto[];
}

export class AiMessageResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty({ enum: ['user', 'assistant'] })
  role: string;

  @ApiProperty()
  content: string;

  @ApiProperty({ type: [ProductResponseDto] })
  products: ProductResponseDto[];

  @ApiPropertyOptional({ type: [AgentActionDto] })
  actions?: AgentActionDto[];

  @ApiProperty()
  created_at: Date;
}

export class AiConversationDetailResponseDto {
  @ApiProperty()
  conversation_id: number;

  @ApiProperty({ type: [AiMessageResponseDto] })
  messages: AiMessageResponseDto[];
}

export class AiConfigResponseDto {
  @ApiProperty({ description: 'Whether the storefront chatbox is enabled' })
  enabled: boolean;
}
