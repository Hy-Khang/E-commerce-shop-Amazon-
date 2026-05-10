import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';

export class UpdateImageDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(0)
  sort_order: number;
}
