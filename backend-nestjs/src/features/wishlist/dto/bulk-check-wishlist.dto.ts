import { ApiProperty } from '@nestjs/swagger';
import { ArrayMaxSize, IsArray, IsInt, IsPositive } from 'class-validator';

export class BulkCheckWishlistDto {
  @ApiProperty({ description: 'Array of product IDs to check (max 50)', type: [Number] })
  @IsArray()
  @IsInt({ each: true })
  @IsPositive({ each: true })
  @ArrayMaxSize(50)
  product_ids: number[];
}
