import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsPositive } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateConversationDto {
  @ApiProperty({ description: 'Shop to start a conversation with', example: 1 })
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  shop_id: number;
}
