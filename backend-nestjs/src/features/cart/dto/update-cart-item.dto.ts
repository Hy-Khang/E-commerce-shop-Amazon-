import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsPositive } from 'class-validator';

export class UpdateCartItemDto {
  @ApiProperty({ description: 'New quantity', minimum: 1 })
  @IsInt()
  @IsPositive()
  quantity: number;
}
