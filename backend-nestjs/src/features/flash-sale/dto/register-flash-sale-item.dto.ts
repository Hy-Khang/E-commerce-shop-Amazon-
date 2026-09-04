import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsNumber, IsPositive } from 'class-validator';

/** Seller registers one of their variants into a campaign. */
export class RegisterFlashSaleItemDto {
  @ApiProperty({
    example: 12,
    description: 'Target product variant id (must belong to the seller shop)',
  })
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  product_variant_id: number;

  @ApiProperty({
    example: 199000,
    description:
      'Flash sale price (VND) — must meet the campaign discount floor',
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  flash_price: number;

  @ApiProperty({
    example: 50,
    description: 'Units available at the flash price',
  })
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  flash_quantity: number;
}
