import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ConversationResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  shop_id: number;

  @ApiProperty()
  shop_name: string;

  @ApiPropertyOptional({ nullable: true })
  shop_logo_url: string | null;

  @ApiProperty({ description: 'Customer user id on this conversation' })
  customer_id: number;

  @ApiProperty({ description: 'Display name of the other party' })
  counterpart_name: string;

  @ApiPropertyOptional({ nullable: true })
  last_message_preview: string | null;

  @ApiPropertyOptional({ nullable: true })
  last_message_at: Date | null;

  @ApiProperty({ description: 'Unread count for the calling side' })
  unread_count: number;
}

export class MessageResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  conversation_id: number;

  @ApiProperty()
  sender_id: number;

  @ApiProperty({ enum: ['customer', 'seller'] })
  sender_type: string;

  @ApiProperty()
  content: string;

  @ApiProperty({ enum: ['sent', 'delivered', 'read'] })
  status: string;

  @ApiProperty()
  created_at: Date;
}

export class ChatUnreadCountResponseDto {
  @ApiProperty()
  count: number;
}
