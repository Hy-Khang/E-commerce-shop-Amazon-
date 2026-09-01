import { ApiProperty } from '@nestjs/swagger';
import { ProductResponseDto } from '../../product/dto/product-response.dto';

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
