import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsPositive } from 'class-validator';

export class AddCartItemDto {
  @ApiProperty({ description: 'Product variant ID' })
  @IsInt()
  @IsPositive()
  product_variant_id: number;

  @ApiProperty({ description: 'Quantity to add', minimum: 1 })
  @IsInt()
  @IsPositive()
  quantity: number;
}
