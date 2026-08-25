import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsOptional, IsPositive, IsString, MaxLength } from 'class-validator';
import { IsImagePath } from '../../../common/validators/is-image-path.validator';
import { normalizeOptionalString } from '../../../common/transforms/normalize-optional-string.transform';

export class CreateProductDto {
  @ApiProperty({ example: 'Basic T-Shirt' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiProperty({ example: 'basic-t-shirt' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  slug: string;

  @ApiProperty({ example: 1 })
  @IsInt()
  @IsPositive()
  category_id: number;

  @ApiPropertyOptional({ example: 1, description: 'Owning shop id (admin only). Omit to leave the product unassigned.' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  shop_id?: number;

  @ApiPropertyOptional({ example: 'A comfortable basic t-shirt for everyday wear' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'https://cdn.example.com/img/tshirt.jpg' })
  @IsOptional()
  @IsString()
  @IsImagePath()
  @MaxLength(500)
  thumbnail_url?: string;

  @ApiPropertyOptional({ example: 'Color', description: 'Label for variant option 1 (e.g. Color, RAM, Connectivity)' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  @Transform(normalizeOptionalString)
  option1_label?: string;

  @ApiPropertyOptional({ example: 'Size', description: 'Label for variant option 2 (e.g. Size, Storage, DPI)' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  @Transform(normalizeOptionalString)
  option2_label?: string;
}
