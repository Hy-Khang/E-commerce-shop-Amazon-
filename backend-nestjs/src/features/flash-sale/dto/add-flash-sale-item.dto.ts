import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsNumber, IsPositive } from 'class-validator';

export class AddFlashSaleItemDto {
  @ApiProperty({ example: 12, description: 'Target product variant id' })
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  product_variant_id: number;

  @ApiProperty({ example: 199000, description: 'Flash sale price (VND)' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  flash_price: number;

  @ApiProperty({ example: 50, description: 'Units available at the flash price' })
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  flash_quantity: number;
}
