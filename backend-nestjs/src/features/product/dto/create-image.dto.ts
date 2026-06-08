import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { IsImagePath } from '../../../common/validators/is-image-path.validator';

export class CreateImageDto {
  @ApiProperty({ example: 'https://cdn.example.com/img/product-1.jpg' })
  @IsString()
  @IsNotEmpty()
  @IsImagePath()
  @MaxLength(500)
  image_url: string;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  sort_order?: number;

  @ApiPropertyOptional({ example: 'Black', description: 'Option1 value to associate image with a variant group (e.g., color). NULL = shared image.' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  @Transform(({ value }) => typeof value === 'string' ? (value.trim() || null) : value)
  variant_option1?: string;
}
