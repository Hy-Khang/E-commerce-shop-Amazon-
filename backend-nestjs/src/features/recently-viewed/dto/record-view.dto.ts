import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsPositive } from 'class-validator';
import { Type } from 'class-transformer';

export class RecordViewDto {
  @ApiProperty({ description: 'Product being viewed', example: 1 })
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  product_id: number;
}
