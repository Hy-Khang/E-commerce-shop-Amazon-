import { ApiPropertyOptional, OmitType, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsPositive, ValidateIf } from 'class-validator';
import { CreateProductDto } from './create-product.dto';

// Omit `shop_id` from the partial base so we can redeclare it as nullable here
// (update allows clearing) without widening the create DTO, whose `shop_id`
// stays non-null.
export class UpdateProductDto extends PartialType(
  OmitType(CreateProductDto, ['shop_id'] as const),
) {
  // Admin-only. `null` unassigns the product (orphans it); omitting the field
  // leaves the current shop unchanged. `ValidateIf` skips the int/positive
  // checks for an explicit null so clearing is accepted, while a supplied
  // value is still validated. Sellers never reach this — updateProductForSeller
  // strips shop_id before delegating.
  @ApiPropertyOptional({
    example: 1,
    nullable: true,
    description:
      'Owning shop id (admin only). Send null to unassign the product; omit to leave unchanged.',
  })
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  shop_id?: number | null;
}
