import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsPositive } from 'class-validator';

export class AddWishlistItemDto {
  @ApiProperty({ description: 'Product ID to add to wishlist' })
  @IsInt()
  @IsPositive()
  product_id: number;
}
