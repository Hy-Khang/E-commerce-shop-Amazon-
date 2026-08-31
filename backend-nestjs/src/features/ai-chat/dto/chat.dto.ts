import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { AI_MESSAGE_MAX_LENGTH } from '../types/ai-chat.types';

export class ChatDto {
  @ApiProperty({ maxLength: AI_MESSAGE_MAX_LENGTH, description: 'User message' })
  @IsString()
  @MinLength(1)
  @MaxLength(AI_MESSAGE_MAX_LENGTH)
  message: string;

  @ApiPropertyOptional({ description: 'Existing conversation to continue' })
  @IsOptional()
  @IsInt()
  conversation_id?: number;
}
