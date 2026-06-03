import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsPositive, IsString, MaxLength } from 'class-validator';
import { IsImagePath } from '../../../common/validators/is-image-path.validator';

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
}
