import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsInt,
  IsISO8601,
  IsPositive,
  ValidateNested,
} from 'class-validator';

export class MergeRecentlyViewedItemDto {
  @ApiProperty({ description: 'Product id', example: 1 })
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  product_id: number;

  @ApiProperty({
    description: 'When the product was viewed (ISO 8601)',
    example: '2026-08-30T10:00:00.000Z',
  })
  @IsISO8601()
  viewed_at: string;
}

export class MergeRecentlyViewedDto {
  @ApiProperty({
    type: [MergeRecentlyViewedItemDto],
    description: 'Guest view history (max 50)',
  })
  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => MergeRecentlyViewedItemDto)
  items: MergeRecentlyViewedItemDto[];
}
